import { Diagnosis } from '../models/Diagnosis.js';
import { DiseaseLocation } from '../models/DiseaseLocation.js';
import { AppError } from '../utils/AppError.js';
import { detectDisease, predictRisk, treatmentFor } from './aiClient.service.js';
import { nearestTownship, normalizeDiseaseName } from './heatmap.service.js';
import { uploadBuffer } from './storage.service.js';
import { getCurrent } from './weather.service.js';
import { writeAuditLog } from './audit.service.js';
import { Notification } from '../models/Notification.js';
import { createNotification, notifyStaff } from './notification.service.js';

function messageForQualityIssues(issues: string[]): string {
  if (issues.some((i) => i === 'not_leaf_like' || i === 'not_rice_leaf' || i === 'not_crop')) {
    return 'This image does not look like a supported crop. Please upload a clear leaf, stem, or pest-damage photo of a farm crop.';
  }
  if (issues.includes('low_confidence')) {
    return 'Could not confidently identify a crop disease. Please try a clearer leaf photo.';
  }
  if (issues.includes('decode_failed')) {
    return 'Could not read the image. Please upload a valid JPEG, PNG, or WebP file.';
  }
  if (issues.some((i) => i.startsWith('model_error:'))) {
    return 'Disease analysis is temporarily unavailable. Please try again shortly.';
  }
  return 'Image quality too low. Please use a clearer, well-lit leaf photo.';
}

export async function analyzeImage(input: {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  filename: string;
  lng?: number;
  lat?: number;
  township?: string;
}) {
  const imageUrl = await uploadBuffer(input.buffer, input.filename, input.mimeType);
  const ai = await detectDisease(input.buffer, input.mimeType);

  if (ai.quality && ai.quality.ok === false) {
    const issues = Array.isArray(ai.quality.issues) ? ai.quality.issues : [];
    const message = messageForQualityIssues(issues);
    throw new AppError(message, 400, issues);
  }

  // Extra safety: never save a diagnosis without an accepted supported crop
  if (!ai.cropType) {
    throw new AppError(
      'This image does not look like a supported crop. Please upload a clear leaf, stem, or pest-damage photo.',
      400,
      ['not_leaf_like']
    );
  }

  const lng = input.lng ?? 96.1951;
  const lat = input.lat ?? 16.8661;
  let weatherConditions = {
    temperature: 0,
    humidity: 0,
    rainfall: 0,
    windSpeed: 0,
  };

  try {
    const { current } = await getCurrent(lat, lng);
    const c = current as {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      precipitation?: number;
      wind_speed_10m?: number;
    } | null;
    if (c) {
      weatherConditions = {
        temperature: c.temperature_2m ?? 0,
        humidity: c.relative_humidity_2m ?? 0,
        rainfall: c.precipitation ?? 0,
        windSpeed: c.wind_speed_10m ?? 0,
      };
    }
  } catch {
    // weather optional for diagnosis persistence
  }

  const disease = normalizeDiseaseName(ai.disease);

  let prediction;
  try {
    prediction = await predictRisk({
      cropType: ai.cropType,
      disease,
      ...weatherConditions,
    });
  } catch {
    prediction = {
      riskLevel: 'Medium' as const,
      forecastDays: 14,
      confidence: 0,
    };
  }

  const snapped = nearestTownship(lat, lng, input.township);

  const diagnosis = await Diagnosis.create({
    userId: input.userId,
    imageUrl,
    cropType: ai.cropType,
    disease,
    severityIndex: ai.severityIndex,
    probabilities: ai.probabilities,
    location: { type: 'Point', coordinates: [lng, lat] },
    weatherConditions,
    prediction,
    treatmentProtocol: ai.treatmentProtocol || treatmentFor(disease, ai.cropType),
    aiDetectedDisease: disease,
    isVerified: false,
    reviewRequested: false,
  });

  await DiseaseLocation.create({
    diagnosticId: diagnosis._id,
    location: { type: 'Point', coordinates: [lng, lat] },
    township: snapped.township,
    disease,
    severity: ai.severityIndex,
    timestamp: new Date(),
  });

  return diagnosis;
}

export async function predict(input: {
  cropType?: string;
  disease?: string;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
}) {
  return predictRisk(input);
}

export async function history(userId: string) {
  return Diagnosis.find({ userId }).sort({ createdAt: -1 });
}

export async function listForReview(query: {
  verified?: string;
  status?: string;
  limit?: number;
}) {
  const filter: Record<string, unknown> = {};
  const status = String(query.status || 'pending').toLowerCase();
  if (status === 'all') {
    /* no extra filter */
  } else if (status === 'pending' || query.verified === 'false') {
    filter.isVerified = false;
    filter.isRejected = { $ne: true };
    filter.reviewRequested = true;
  } else if (status === 'verified' || query.verified === 'true') {
    filter.isVerified = true;
  } else if (status === 'rejected') {
    filter.isRejected = true;
  }
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 40));
  return Diagnosis.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'email fullName role avatarUrl')
    .populate('verifiedBy', 'fullName email')
    .populate('rejectedBy', 'fullName email');
}

export async function getDiagnosis(id: string, requester: { id: string; role: string }) {
  const doc = await Diagnosis.findById(id)
    .populate('userId', 'email fullName role avatarUrl')
    .populate('verifiedBy', 'fullName email')
    .populate('rejectedBy', 'fullName email');
  if (!doc) throw new AppError('Diagnosis not found', 404);
  const ownerId =
    typeof doc.userId === 'object' && doc.userId && '_id' in doc.userId
      ? String((doc.userId as { _id: unknown })._id)
      : String(doc.userId);
  const isOwner = ownerId === requester.id;
  const isStaff = requester.role === 'expert' || requester.role === 'admin';
  if (!isOwner && !isStaff) throw new AppError('Forbidden', 403);
  return doc;
}

export async function updateDiagnosis(
  id: string,
  updates: Partial<{ disease: string; severityIndex: number; treatmentProtocol: string; cropType: string }>,
  actorId: string
) {
  const doc = await Diagnosis.findByIdAndUpdate(id, updates, { new: true });
  if (!doc) throw new AppError('Diagnosis not found', 404);
  await writeAuditLog({
    actorId,
    action: 'DIAGNOSIS_UPDATE',
    resourceType: 'Diagnosis',
    resourceId: id,
    metadata: updates,
  });
  return doc;
}

export type VerifyDiagnosisInput = {
  disease?: string;
  severityIndex?: number;
  treatmentProtocol?: string;
  expertSuggestion?: string;
  expertBooks?: string;
  expertDrugs?: string;
};

export async function verifyDiagnosis(
  id: string,
  actorId: string,
  input: VerifyDiagnosisInput = {}
) {
  const existing = await Diagnosis.findById(id);
  if (!existing) throw new AppError('Diagnosis not found', 404);
  if (existing.isVerified) throw new AppError('Diagnosis already verified', 400);

  const aiOriginal =
    String(existing.aiDetectedDisease || '').trim() || String(existing.disease || '').trim();
  const nextDisease = normalizeDiseaseName(
    String(input.disease || existing.disease || 'Healthy').trim() || 'Healthy'
  );
  const diseaseCorrected = nextDisease !== aiOriginal;
  const expertSuggestion = String(input.expertSuggestion || '').trim().slice(0, 2000);
  const expertBooks = String(input.expertBooks || '').trim().slice(0, 1000);
  const expertDrugs = String(input.expertDrugs || '').trim().slice(0, 1000);
  const severityIndex =
    input.severityIndex != null
      ? Math.max(0, Math.min(100, Number(input.severityIndex)))
      : existing.severityIndex;
  const treatmentProtocol =
    input.treatmentProtocol?.trim() ||
    (diseaseCorrected ? treatmentFor(nextDisease, existing.cropType) : existing.treatmentProtocol) ||
    treatmentFor(nextDisease, existing.cropType);

  const doc = await Diagnosis.findByIdAndUpdate(
    id,
    {
      $set: {
        disease: nextDisease,
        aiDetectedDisease: aiOriginal,
        diseaseCorrected,
        severityIndex,
        treatmentProtocol,
        expertSuggestion,
        expertBooks,
        expertDrugs,
        isVerified: true,
        verifiedBy: actorId,
        verifiedAt: new Date(),
        isRejected: false,
        rejectionReason: '',
        reviewRequested: false,
      },
      $unset: { rejectedBy: 1, rejectedAt: 1 },
    },
    { new: true }
  );
  if (!doc) throw new AppError('Diagnosis not found', 404);

  if (diseaseCorrected || input.severityIndex != null) {
    await DiseaseLocation.updateMany(
      { diagnosticId: doc._id },
      {
        $set: {
          disease: nextDisease,
          ...(input.severityIndex != null ? { severity: severityIndex } : {}),
        },
      }
    );
  }

  await writeAuditLog({
    actorId,
    action: 'DIAGNOSIS_VERIFY',
    resourceType: 'Diagnosis',
    resourceId: id,
    metadata: {
      disease: nextDisease,
      aiDetectedDisease: aiOriginal,
      diseaseCorrected,
      expertBooks: expertBooks.slice(0, 120),
      expertDrugs: expertDrugs.slice(0, 120),
    },
  });

  const correctionNote = diseaseCorrected
    ? ` Corrected from "${aiOriginal}" to "${nextDisease}".`
    : '';
  const adviceBits = [
    expertDrugs ? `Drugs: ${expertDrugs}` : '',
    expertBooks ? `Books: ${expertBooks}` : '',
    expertSuggestion ? expertSuggestion : '',
  ].filter(Boolean);
  const adviceNote = adviceBits.length ? ` Expert advice: ${adviceBits.join(' · ')}` : '';

  await createNotification({
    userId: String(doc.userId),
    type: 'diagnosis_verified',
    title: diseaseCorrected ? 'Detection corrected & accepted' : 'Detection accepted',
    body: `Your ${doc.cropType} detection (${nextDisease}) was accepted by an expert.${correctionNote}${adviceNote}`.slice(
      0,
      500
    ),
    link: '/detect',
    fromUserId: actorId,
    meta: {
      diagnosisId: id,
      disease: nextDisease,
      aiDetectedDisease: aiOriginal,
      diseaseCorrected,
      cropType: doc.cropType,
      expertSuggestion,
      expertBooks,
      expertDrugs,
    },
  });

  return Diagnosis.findById(id)
    .populate('userId', 'email fullName role avatarUrl')
    .populate('verifiedBy', 'fullName email');
}

export async function rejectDiagnosis(id: string, actorId: string, reason: string) {
  const note = reason.trim();
  if (note.length < 3) throw new AppError('Please provide a short reason', 400);

  const existing = await Diagnosis.findById(id);
  if (!existing) throw new AppError('Diagnosis not found', 404);
  if (existing.isVerified) {
    throw new AppError('Verified detections cannot be denied. Delete it instead.', 400);
  }

  const doc = await Diagnosis.findByIdAndUpdate(
    id,
    {
      $set: {
        isRejected: true,
        rejectionReason: note.slice(0, 500),
        rejectedBy: actorId,
        rejectedAt: new Date(),
        isVerified: false,
        reapprovalNote: '',
      },
      $unset: { reapprovalRequestedAt: 1 },
    },
    { new: true }
  );
  if (!doc) throw new AppError('Diagnosis not found', 404);

  // Keep denied detections off the public heatmap
  await DiseaseLocation.deleteMany({ diagnosticId: doc._id });

  await writeAuditLog({
    actorId,
    action: 'DIAGNOSIS_REJECT',
    resourceType: 'Diagnosis',
    resourceId: id,
    metadata: { reason: note.slice(0, 200), disease: doc.disease, cropType: doc.cropType },
  });

  await createNotification({
    userId: String(doc.userId),
    type: 'diagnosis_rejected',
    title: 'Detection denied',
    body: `Your ${doc.cropType} detection (${doc.disease}) was denied. Reason: ${note}`,
    link: '/messages?tab=notices',
    fromUserId: actorId,
    meta: {
      diagnosisId: id,
      disease: doc.disease,
      cropType: doc.cropType,
      reason: note,
    },
  });

  return Diagnosis.findById(id)
    .populate('userId', 'email fullName role avatarUrl')
    .populate('rejectedBy', 'fullName email');
}

export async function requestReapproval(id: string, userId: string, note: string) {
  const message = note.trim();
  if (message.length < 3) throw new AppError('Please write a short message', 400);

  const existing = await Diagnosis.findById(id);
  if (!existing) throw new AppError('Diagnosis not found', 404);
  if (String(existing.userId) !== userId) throw new AppError('Forbidden', 403);
  if (!existing.isRejected) {
    throw new AppError('Only denied detections can request reapproval', 400);
  }
  if (existing.reapprovalRequestedAt) {
    const hours =
      (Date.now() - new Date(existing.reapprovalRequestedAt).getTime()) / (1000 * 60 * 60);
    if (hours < 12) {
      throw new AppError('You already requested reapproval. Please wait before asking again.', 400);
    }
  }

  const prevReason = existing.rejectionReason || '';
  const coords = existing.location?.coordinates || [0, 0];
  const lat = Number(coords[1]) || 16.8661;
  const lng = Number(coords[0]) || 96.1951;
  const snapped = nearestTownship(lat, lng);

  const doc = await Diagnosis.findByIdAndUpdate(
    id,
    {
      $set: {
        isRejected: false,
        isVerified: false,
        reviewRequested: true,
        reviewRequestedAt: new Date(),
        reapprovalNote: message.slice(0, 500),
        reapprovalRequestedAt: new Date(),
      },
      $unset: { rejectedBy: 1, rejectedAt: 1 },
    },
    { new: true }
  );
  if (!doc) throw new AppError('Diagnosis not found', 404);

  const hasLoc = await DiseaseLocation.exists({ diagnosticId: doc._id });
  if (!hasLoc) {
    await DiseaseLocation.create({
      diagnosticId: doc._id,
      location: { type: 'Point', coordinates: [lng, lat] },
      township: snapped.township,
      disease: doc.disease,
      severity: doc.severityIndex || 0,
      timestamp: new Date(),
    });
  }

  await writeAuditLog({
    actorId: userId,
    action: 'DIAGNOSIS_REAPPROVAL_REQUEST',
    resourceType: 'Diagnosis',
    resourceId: id,
    metadata: { note: message.slice(0, 200), previousReason: prevReason.slice(0, 200) },
  });

  await notifyStaff({
    type: 'reapproval_requested',
    title: 'Detection reapproval requested',
    body: `${doc.cropType} / ${doc.disease}: ${message}`,
    link: '/admin/diagnoses',
    fromUserId: userId,
    meta: {
      diagnosisId: id,
      disease: doc.disease,
      cropType: doc.cropType,
      reason: prevReason,
      appealMessage: message,
    },
  });

  await createNotification({
    userId,
    type: 'system',
    title: 'Reapproval requested',
    body: 'Your detection was sent back for expert review. We will notify you when it is reviewed.',
    link: '/messages?tab=notices',
    meta: { diagnosisId: id },
  });

  await Notification.updateMany(
    { userId, type: 'diagnosis_rejected', 'meta.diagnosisId': id },
    {
      $set: {
        'meta.appealed': true,
        'meta.appealMessage': message.slice(0, 500),
        'meta.appealedAt': new Date().toISOString(),
      },
    }
  );

  return doc;
}

/** Farmer opts in so experts/admins can review this detection. */
export async function requestExpertReview(id: string, userId: string) {
  const existing = await Diagnosis.findById(id);
  if (!existing) throw new AppError('Diagnosis not found', 404);
  if (String(existing.userId) !== userId) throw new AppError('Forbidden', 403);
  if (existing.isRejected) {
    throw new AppError('This detection was denied. Ask for reapproval instead.', 400);
  }
  if (existing.isVerified) {
    throw new AppError('This detection is already verified', 400);
  }
  if (existing.reviewRequested) {
    return existing;
  }

  const doc = await Diagnosis.findByIdAndUpdate(
    id,
    {
      $set: {
        reviewRequested: true,
        reviewRequestedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!doc) throw new AppError('Diagnosis not found', 404);

  await writeAuditLog({
    actorId: userId,
    action: 'DIAGNOSIS_REVIEW_REQUEST',
    resourceType: 'Diagnosis',
    resourceId: id,
    metadata: { disease: doc.disease, cropType: doc.cropType },
  });

  await notifyStaff({
    type: 'diagnosis_review_requested',
    title: 'Expert review requested',
    body: `${doc.cropType} / ${doc.disease} — a farmer asked for expert review.`,
    link: '/admin/diagnoses',
    fromUserId: userId,
    meta: {
      diagnosisId: id,
      disease: doc.disease,
      cropType: doc.cropType,
      sourceType: 'diagnosis_review_requested',
    },
  });

  await createNotification({
    userId,
    type: 'system',
    title: 'Review request sent',
    body: 'Your detection was sent to experts for review. We will notify you when it is reviewed.',
    link: '/messages?tab=notices',
    meta: { diagnosisId: id },
  });

  return doc;
}

export async function deleteDiagnosis(
  id: string,
  requester: { id: string; role: string }
) {
  const doc = await Diagnosis.findById(id);
  if (!doc) throw new AppError('Diagnosis not found', 404);

  const isOwner = String(doc.userId) === requester.id;
  const isAdmin = requester.role === 'admin';
  const isExpert = requester.role === 'expert';
  if (!isOwner && !isAdmin && !isExpert) {
    throw new AppError('Forbidden', 403);
  }

  await DiseaseLocation.deleteMany({ diagnosticId: doc._id });
  await doc.deleteOne();

  await writeAuditLog({
    actorId: requester.id,
    action: 'DIAGNOSIS_DELETE',
    resourceType: 'Diagnosis',
    resourceId: id,
    metadata: {
      disease: doc.disease,
      cropType: doc.cropType,
      deletedByRole: requester.role,
      ownerId: String(doc.userId),
    },
  });

  return { deleted: true, id };
}
