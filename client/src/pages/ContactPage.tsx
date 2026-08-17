import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { contactCopy } from '../i18n/messages';

export function ContactPage() {
  const { lang } = useLanguage();
  const t = contactCopy(lang);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setNote(t.required);
      return;
    }
    const subject = encodeURIComponent(`Smart Agro: ${name.trim()}`);
    const body = encodeURIComponent(`${name.trim()} <${email.trim()}>\n\n${message.trim()}`);
    window.location.href = `mailto:${t.emailValue}?subject=${subject}&body=${body}`;
    setNote(t.sent);
  }

  return (
    <div className="faq-page contact-page">
      <section className="faq-hero" aria-labelledby="contact-hero-title">
        <div className="faq-hero-art" aria-hidden>
          <div className="faq-hill faq-hill-a" />
          <div className="faq-hill faq-hill-b" />
          <div className="faq-hill faq-hill-c" />
          <div className="faq-tree faq-tree-1" />
          <div className="faq-tree faq-tree-2" />
        </div>
        <div className="faq-hero-content">
          <Link className="faq-back" to="/">
            ← {t.backHome}
          </Link>
          <h1 id="contact-hero-title">{t.title}</h1>
          <p>{t.lead}</p>
        </div>
      </section>

      <section className="contact-body">
        <div className="contact-cards">
          <div className="contact-card">
            <strong>{t.school}</strong>
            <span>{t.place}</span>
          </div>
          <a className="contact-card" href={`mailto:${t.emailValue}`}>
            <strong>{t.emailLabel}</strong>
            <span>{t.emailValue}</span>
          </a>
          <Link className="contact-card" to="/faq">
            <strong>{t.faqLabel}</strong>
            <span>{t.faqLead}</span>
          </Link>
          <Link className="contact-card" to="/chat">
            <strong>{t.chatLabel}</strong>
            <span>{t.chatLead}</span>
          </Link>
        </div>

        <form className="contact-form" onSubmit={onSubmit}>
          <h2>{t.formTitle}</h2>
          <label>
            {t.name}
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label>
            {t.email}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </label>
          <label>
            {t.message}
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <button type="submit" className="button">
            {t.send}
          </button>
          {note && <p className="contact-note">{note}</p>}
        </form>
      </section>
    </div>
  );
}
