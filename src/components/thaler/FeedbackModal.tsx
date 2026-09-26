/**
 * FeedbackModal: High-Touch User Review & Clinical Feedback System
 * Directly sends user ratings and feedback to farreladitya38@gmail.com via FormSubmit AJAX.
 * Features 5-star rating, category chips, automated engagement telemetry,
 * 5-state error/retry handling with mailto fallback, and anti-annoyance dismissal guards.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
  X,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { FeedbackStorage } from '../../engine/storage/feedbackStorage';
import { useLocale } from '../../locales/useLocale';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutomaticPrompt?: boolean;
}

const TARGET_EMAIL = 'farreladitya38@gmail.com';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  isAutomaticPrompt = false,
}) => {
  const { t, locale } = useLocale();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>(t.feedback.categories[0]);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [userContact, setUserContact] = useState<string>('');
  const [submissionState, setSubmissionState] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const engagement = FeedbackStorage.load();

  const handleRatingClick = (val: number) => {
    setRating(val);
  };

  const handleRemindLater = () => {
    FeedbackStorage.setRemindLater();
    onClose();
  };

  const handleDismissPermanently = () => {
    FeedbackStorage.setDismissed();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert(t.feedback.ratingRequiredAlert);
      return;
    }

    setSubmissionState('LOADING');
    setErrorMessage('');

    const payload = locale === 'en' ? {
      _subject: `[Thaler ECG Feedback] ⭐ ${rating}/5 - ${category}`,
      _template: 'table',
      _captcha: 'false',
      '⭐ User Rating': `${rating} / 5 Stars (${t.feedback.ratings[rating] || ''})`,
      'Feedback Category': category,
      'Message & Comments': feedbackText.trim() || '(Star rating only)',
      'User Name / Contact': userContact.trim() || 'Anonymous (Web User)',
      'Completed Tutorial Cases': `${engagement.completedTutorialCases.length} cases`,
      'Completed Practice Sessions': `${engagement.completedPracticeSessions} sessions`,
      'Submission Time': new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }),
      'User Platform': typeof navigator !== 'undefined' ? navigator.userAgent : 'Not detected',
    } : {
      _subject: `[Masukan EKG Thaler] ⭐ ${rating}/5 - ${category}`,
      _template: 'table',
      _captcha: 'false',
      '⭐ Rating Pengguna': `${rating} / 5 Bintang (${t.feedback.ratings[rating] || ''})`,
      'Kategori Masukan': category,
      'Pesan & Saran': feedbackText.trim() || '(Hanya memberikan rating bintang)',
      'Nama / Kontak Pengguna': userContact.trim() || 'Anonim (Pengguna Web)',
      'Kasus Tutorial Diselesaikan': `${engagement.completedTutorialCases.length} kasus`,
      'Sesi Latihan Diselesaikan': `${engagement.completedPracticeSessions} sesi`,
      'Waktu Pengiriman': new Date().toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }),
      'Platform Pengguna': typeof navigator !== 'undefined' ? navigator.userAgent : 'Tidak terdeteksi',
    };

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        FeedbackStorage.setSubmitted(rating);
        setSubmissionState('SUCCESS');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            (locale === 'en'
              ? 'Failed to send feedback form via relay server.'
              : 'Gagal mengirim formulir masukan via server relay.')
        );
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmissionState('ERROR');
      setErrorMessage(
        err.message ||
          (locale === 'en'
            ? 'Network connection interrupted or blocked by third-party blocker.'
            : 'Koneksi jaringan terganggu atau terhalang pemblokir pihak ketiga.')
      );
    }
  };

  // Generate native mailto fallback link in case of network restrictions
  const mailtoSubject = encodeURIComponent(
    locale === 'en'
      ? `[Thaler ECG Feedback] Rating: ${rating}/5 - ${category}`
      : `[Masukan EKG Thaler] Rating: ${rating}/5 - ${category}`
  );
  const mailtoBody = encodeURIComponent(
    locale === 'en'
      ? `Rating: ${rating} / 5 Stars\nCategory: ${category}\nName/Contact: ${userContact || 'Anonymous'}\n\nMessage / Suggestions:\n${feedbackText}\n\n(Sent from ECG Simulator App)`
      : `Rating: ${rating} / 5 Bintang\nKategori: ${category}\nNama/Kontak: ${userContact || 'Anonim'}\n\nPesan / Masukan:\n${feedbackText}\n\n(Terkirim dari Aplikasi EKG Simulator)`
  );
  const mailtoUrl = `mailto:${TARGET_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/65 backdrop-blur-xs font-sans animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg flex flex-col overflow-hidden text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>{t.feedback.title}</span>
                {isAutomaticPrompt && (
                  <span className="px-1.5 py-0.2 bg-purple-600/60 border border-purple-400/40 rounded text-[9.5px] font-mono">
                    {t.feedback.badge}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-stone-400">
                {t.feedback.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition cursor-pointer"
            title={t.common.closeEsc}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {submissionState === 'SUCCESS' ? (
            /* SUCCESS STATE */
            <div className="text-center py-6 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-stone-900">
                {t.feedback.successTitle}
              </h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                {t.feedback.successDesc.replace('{email}', TARGET_EMAIL)}
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  {t.feedback.closeWindow}
                </button>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Star Rating Section */}
              <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200 text-center space-y-1.5">
                <label className="text-xs font-bold text-stone-800 block">
                  {t.feedback.question}
                </label>
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const activeVal = hoverRating || rating;
                    const isFilled = starVal <= activeVal;
                    return (
                      <button
                        type="button"
                        key={starVal}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRatingClick(starVal)}
                        className="p-1 text-stone-300 transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                        title={`${starVal} Star`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-xs'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] font-semibold text-purple-800 h-4">
                  {t.feedback.ratings[hoverRating || rating]}
                </div>
              </div>

              {/* Category Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 block">
                  {t.feedback.categoryLabel}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {t.feedback.categories.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-700 text-white font-bold border-purple-700 shadow-2xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 block">
                  {t.feedback.commentsLabel}
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t.feedback.commentsPlaceholder}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 placeholder:text-stone-400"
                />
              </div>

              {/* Optional Name/Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700">
                    {t.feedback.contactLabel}
                  </label>
                  <span className="text-[10px] text-stone-500">{t.feedback.contactSubtext}</span>
                </div>
                <input
                  type="text"
                  value={userContact}
                  onChange={(e) => setUserContact(e.target.value)}
                  placeholder={t.feedback.contactPlaceholder}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 placeholder:text-stone-400"
                />
              </div>

              {/* Recipient Transparency Badge */}
              <div className="flex items-center justify-between text-[10.5px] text-stone-500 bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t.feedback.recipientLabel}</span>
                </span>
                <span className="font-mono font-bold text-stone-700 truncate max-w-[200px]">
                  {TARGET_EMAIL}
                </span>
              </div>

              {/* Error & Fallback Banner */}
              {submissionState === 'ERROR' && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg space-y-2 text-rose-900 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{t.feedback.errorPrefix}</span>
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <a
                      href={mailtoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold text-[11px] transition shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{t.feedback.mailClientBtn}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submissionState === 'LOADING'}
                  className={`w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    submissionState === 'LOADING' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submissionState === 'LOADING' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t.feedback.submittingBtn.replace('{email}', TARGET_EMAIL)}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.feedback.submitBtn}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Anti-Annoyance Dismissal Controls (Shown if automatically prompted) */}
              {isAutomaticPrompt && (
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[10.5px]">
                  <button
                    type="button"
                    onClick={handleRemindLater}
                    className="text-stone-500 hover:text-stone-800 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{t.feedback.remindLater}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissPermanently}
                    className="text-stone-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    {t.feedback.dismissPermanently}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
