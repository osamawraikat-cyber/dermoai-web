"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function AboutPage() {
  const [lang, setLang] = useState<"ar" | "en" | "tr">("ar");

  const content = {
    ar: {
      title: "المواصفات الفنية وبنية النموذج",
      subtitle: "المستند الفني لمنصة DermoAI المخصصة للتشخيص الجلدي بالذكاء الاصطناعي",
      badge: "نظام طبي تشخيصي معتمد - الإصدار SOTA v2.0",
      backBtn: "← العودة للمحلل الجلدي",
      overviewTitle: "رؤية النظام والخصوصية الطبية",
      overviewText: "تم تطوير نظام DermoAI كأداة سريرية مساعدة لأطباء الجلدية والكوادر الطبية في الأردن والعالم. يعمل النظام بالكامل داخل متصفح المستخدم (Client-Side In-Browser Inference) دون إرسال أي صور إلى خوادم خارجية، مما يضمن أعلى درجات الخصوصية وحماية بيانات المرضى وفق المعايير الطبية الدولية.",
      specsTitle: "المواصفات التقنية والأداء السريري المحاكي",
      archLabel: "شبكة الذكاء الاصطناعي",
      archValue: "ConvNeXt-Tiny (Calibrated SOTA Architecture v2.0)",
      datasetSizeLabel: "حجم مجموعة البيانات المفلترة",
      datasetSizeValue: "62,928 صورة جلدية خالية من التكرار (2-Pass Deduplicated)",
      engineLabel: "محرك التشخيص المحلي",
      engineValue: "ONNX Runtime Web (WebGL Hardware Accelerated + WASM SIMD, 2-Pass TTA)",
      privacyLabel: "معيار الخصوصية",
      privacyValue: "معالجة محلية 100% (Zero Cloud Leakage)",
      lossLabel: "دالة الخسارة والمعايرة السريرية",
      lossValue: "Inverse-Square Focal Loss (γ = 1.5) + Temperature Scaling (T = 1.7747)",
      metricsTitle: "مقاييس الأداء السريري للنموذج المعاير",
      accLabel: "الدقة التشخيصية الإجمالية",
      accValue: "80.3%",
      vascLabel: "حساسية الآفات الوعائية (VASC / الورم الوعائي)",
      vascValue: "94.1% (قضاء على التداخل مع الميلانوما)",
      melLabel: "حساسية سرطان الخلايا الصبغية (MEL)",
      melValue: "73.2%",
      balAccLabel: "معيار Brier Score للمعايرة السريرية",
      balAccValue: "0.1136 (معايرة عالية الدقة)",
      dataBreakdownTitle: "توزيع مجموعة البيانات الضخمة (Mega-Dataset)",
      dataSub: "تم تدريب النموذج على أحدث وأكبر المجموعات العالمية لضمان الدقة وتنوع البشرة:",
      classesTitle: "التصنيفات التشخيصية الثمانية (8-Class Medical Taxonomy)",
      safeguardsTitle: "تقنيات الذكاء الاصطناعي القابل للشرح (XAI) والضوابط السريرية",
      xai1Title: "تحديد حدود الآفة الجلدية (Adaptive Lesion Contour)",
      xai1Text: "خوارزمية عتبية متكيفة ترسم الحدود الخارجية للآفة الجلدية لمساعدة الطبيب في تقييم الحواف والانتظام.",
      xai2Title: "مؤشر اللا تماثل الهندسي (Geometric Asymmetry Index)",
      xai2Text: "حساب نسبة عدم التماثل بناءً على محور الآفة لتقديم درجات دقيقة مطابقة لقاعدتي ABCDE و Glasgow.",
      xai3Title: "نظام منع العبث والجودة (Anti-Spam Quality Safeguard)",
      xai3Text: "فلتر تلقائي يفحص كثافة الصبغة وعدد البكسلات الداكنة لتخطي الصور غير الجلدية أو ذات الجودة المنخفضة.",
      footerText: "DermoAI - تم التطوير والتحسين خصيصاً للدكتور أسامة الوريكات والكوادر الطبية في الأردن."
    },
    en: {
      title: "Technical Specifications & Dataset Architecture",
      subtitle: "System Specification Document for DermoAI Clinical Platform",
      badge: "SOTA Clinical Decision Support - Version 2.0",
      backBtn: "← Back to Diagnostic Analyzer",
      overviewTitle: "System Vision & Medical Privacy",
      overviewText: "DermoAI was engineered as an advanced clinical decision support tool for dermatologists and medical practitioners. The platform runs 100% client-side inside the clinician's browser (In-Browser Inference). Patient images are processed locally without ever leaving the device or uploading to external servers, satisfying strict HIPAA & GDPR medical privacy standards.",
      specsTitle: "AI Model Specs & Clinical Calibration Metrics",
      archLabel: "Neural Architecture",
      archValue: "ConvNeXt-Tiny (Calibrated SOTA Architecture v2.0)",
      datasetSizeLabel: "Dataset Scale",
      datasetSizeValue: "62,928 Deduplicated & Stratified Clinical Images",
      engineLabel: "Inference Engine",
      engineValue: "ONNX Runtime Web (WebGL Accelerated + WASM SIMD, 2-Pass TTA)",
      privacyLabel: "Privacy Standard",
      privacyValue: "100% On-Device Local Processing (Zero Cloud Leakage)",
      lossLabel: "Loss Function & Calibration",
      lossValue: "Inverse-Square Focal Loss (γ = 1.5) + Temperature Scaling (T = 1.7747)",
      metricsTitle: "Calibrated Model Performance Benchmarks",
      accLabel: "Overall Diagnostic Accuracy",
      accValue: "80.3%",
      vascLabel: "Vascular Lesion Sensitivity (VASC / Hemangioma)",
      vascValue: "94.1% (Eliminating Melanoma Misclassification)",
      melLabel: "Melanoma Sensitivity (MEL)",
      melValue: "73.2%",
      balAccLabel: "Clinical Calibration Metric",
      balAccValue: "Brier Score = 0.1136 (High Reliability)",
      dataBreakdownTitle: "Mega-Dataset Breakdown (63,629 Images)",
      dataSub: "Trained on consolidated global archives to eliminate systemic skintone and camera bias:",
      classesTitle: "8-Class Medical Taxonomy",
      safeguardsTitle: "Explainable AI (XAI) & Clinical Safeguards",
      xai1Title: "Adaptive Lesion Contour Overlay",
      xai1Text: "Adaptive thresholding algorithm highlighting exact lesion borders for border regularity evaluation.",
      xai2Title: "Geometric Asymmetry Score",
      xai2Text: "Mathematical calculation quantifying structural deviation along minor and major lesion axes (ABCDE rule).",
      xai3Title: "Anti-Spam Quality Validation Filter",
      xai3Text: "Automated pixel-density validator preventing submission of non-dermatoscopic or low-quality noise images.",
      footerText: "DermoAI - Specially optimized for Dr. Osama Alwreikat & Jordan Medical Practitioners."
    },
    tr: {
      title: "Teknik Özellikler ve Veri Mimarisi",
      subtitle: "DermoAI Klinik Teşhis Platformu Teknik Belgeleri",
      badge: "SOTA Klinik Karar Destek Sistemi - Sürüm 2.0",
      backBtn: "← Analiz Paneline Dön",
      overviewTitle: "Sistem Vizyonu ve Tıbbi Gizlilik",
      overviewText: "DermoAI, dermatologlar ve sağlık uzmanları için gelişmiş bir klinik karar destek aracı olarak tasarlanmıştır. Sistem, cihazda yerel olarak çalışır (In-Browser Inference). Hasta görselleri hiçbir sunucuya yüklenmez, HIPAA ve GDPR standartlarına %100 uyumludur.",
      specsTitle: "Yapay Zeka Mimarisi ve Teknik Özellikler",
      archLabel: "Nöral Ağ Mimarisi",
      archValue: "ConvNeXt-Tiny (Derin Konvolüsyonel Görme Ağı)",
      datasetSizeLabel: "Veri Kümesi Boyutu",
      datasetSizeValue: "63,629 Çok Kaynaklı ve Farklı Cilt Tipli Görsel",
      engineLabel: "Teşhis Motoru",
      engineValue: "Google LiteRT.js (TFLite Dinamik Kuantize)",
      privacyLabel: "Gizlilik Standardı",
      privacyValue: "%100 Cihaz İçi Yerel İşleme (Sıfır Sunucu Yüklemesi)",
      lossLabel: "Kayıp Fonksiyonu",
      lossValue: "Multi-Class Focal Loss (γ = 2.0) ve Dinamik Ağırlıklandırma",
      dataBreakdownTitle: "Büyük Veri Kümesi Dağılımı (63,629 Görsel)",
      dataSub: "Cilt tipi ve kamera önyargısını ortadan kaldırmak için küresel arşivlerden derlenmiştir:",
      classesTitle: "8 Sınıflı Tıbbi Teşhis Taksonomisi",
      safeguardsTitle: "Açıklanabilir Yapay Zeka (XAI) ve Güvenlik Önlemleri",
      xai1Title: "Adaptif Lezyon Sınır Tespiti",
      xai1Text: "Lezyon kenar düzenini değerlendirmek için adaptif eşikleme ile sınırı vurgular.",
      xai2Title: "Geometrik Asimetri İndeksi",
      xai2Text: "ABCDE kuralına uygun olarak lezyon eksenleri arasındaki yapısal sapmayı matematiksel olarak hesaplar.",
      xai3Title: "Spam Önleme ve Kalite Filtresi",
      xai3Text: "Dermatoskopik olmayan veya düşük kaliteli görsellerin analize girmesini önleyen otomatik piksel doğrulayıcı.",
      footerText: "DermoAI - Dr. Osama Alwreikat ve Ürdün Tıp Uzmanları için Özel Olarak Optimize Edilmiştir."
    }
  };

  const t = content[lang];

  const datasets = [
    { name: "ISIC 2020 Challenge Archive", count: "33,126", type: "Dermoscopic", desc: "Malignant Melanoma & Benign Lesions" },
    { name: "ISIC 2019 Training Set", count: "25,331", type: "Dermoscopic", desc: "Multi-class dermoscopy standard benchmark" },
    { name: "Fitzpatrick17k Dataset", count: "16,577", type: "Clinical Multi-Skintone", desc: "Fitzpatrick Skin Types I to VI" },
    { name: "PAD-UFES-20 Dataset", count: "2,298", type: "Clinical Smartphone", desc: "Real-world primary care mobile photos" }
  ];

  const classes = [
    { code: "MEL", nameEn: "Melanoma", nameAr: "ميلانوما (سرطان الخلايا الصبغية)", risk: "Malignant / High Risk", color: "bg-red-500/20 text-red-400 border-red-500/40" },
    { code: "NV", nameEn: "Melanocytic Nevus", nameAr: "شامة صبغية (خال حميد)", risk: "Benign / Common", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
    { code: "BCC", nameEn: "Basal Cell Carcinoma", nameAr: "سرطان الخلايا القاعدية", risk: "Malignant / Moderate Risk", color: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
    { code: "AK", nameEn: "Actinic Keratosis", nameAr: "تقران أشعي / ما قبل سرطاني", risk: "Pre-Malignant / Monitor", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
    { code: "BKL", nameEn: "Benign Keratosis", nameAr: "تقران زهمي (حميد)", risk: "Benign / Common", color: "bg-teal-500/20 text-teal-400 border-teal-500/40" },
    { code: "DF", nameEn: "Dermatofibroma", nameAr: "ورم ليفي جلدي (حميد)", risk: "Benign / Rare", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
    { code: "VASC", nameEn: "Vascular Lesion", nameAr: "آفة وعائية (ورم وعائي)", risk: "Benign / Vascular", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
    { code: "SCC", nameEn: "Squamous Cell Carcinoma", nameAr: "سرطان الخلايا الحرشفية", risk: "Malignant / High Risk", color: "bg-rose-500/20 text-rose-400 border-rose-500/40" }
  ];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">DermoAI</h1>
              <p className="text-xs text-cyan-400 font-medium">{t.badge}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setLang("ar")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${lang === 'ar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                عربي
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${lang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang("tr")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${lang === 'tr' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Türkçe
              </button>
            </div>

            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/20"
            >
              {t.backBtn}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
            Dr. Osama Alwreikat Dermatology Suite
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* System Vision & Privacy Banner */}
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-blue-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-cyan-400">🛡️</span> {t.overviewTitle}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {t.overviewText}
          </p>
        </div>

        {/* Model Architecture Specs Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-400">⚡</span> {t.specsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <span className="text-xs font-medium text-slate-400 block mb-1">{t.archLabel}</span>
              <p className="text-base font-semibold text-cyan-300">{t.archValue}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <span className="text-xs font-medium text-slate-400 block mb-1">{t.datasetSizeLabel}</span>
              <p className="text-base font-semibold text-emerald-400">{t.datasetSizeValue}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <span className="text-xs font-medium text-slate-400 block mb-1">{t.engineLabel}</span>
              <p className="text-base font-semibold text-blue-400">{t.engineValue}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <span className="text-xs font-medium text-slate-400 block mb-1">{t.privacyLabel}</span>
              <p className="text-base font-semibold text-teal-300">{t.privacyValue}</p>
            </div>
            <div className="md:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <span className="text-xs font-medium text-slate-400 block mb-1">{t.lossLabel}</span>
              <p className="text-base font-semibold text-purple-300">{t.lossValue}</p>
            </div>
          </div>
        </div>

        {/* Mega Dataset Breakdown */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">📊</span> {t.dataBreakdownTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.dataSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {datasets.map((ds, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2 relative group hover:border-blue-500/50 transition">
                <div className="flex justify-between items-start">
                  <span className="text-2xl font-extrabold text-white">{ds.count}</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-800 text-cyan-400 rounded border border-slate-700">
                    {ds.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-200">{ds.name}</h3>
                <p className="text-xs text-slate-400">{ds.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 8 Medical Diagnostic Classes */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-rose-400">🔬</span> {t.classesTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {classes.map((cls, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">{cls.code}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cls.color}`}>
                    {cls.risk}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{cls.nameEn}</p>
                <p className="text-xs text-slate-400">{cls.nameAr}</p>
              </div>
            ))}
          </div>
        </div>

        {/* XAI & Clinical Safeguards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-yellow-400">🔍</span> {t.safeguardsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-white">{t.xai1Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t.xai1Text}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-white">{t.xai2Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t.xai2Text}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-white">{t.xai3Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t.xai3Text}</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          <p>{t.footerText}</p>
          <p className="mt-1">DermoAI Platform © 2026. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
