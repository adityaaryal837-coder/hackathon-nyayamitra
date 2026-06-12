'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'ne';

// ── Translation Dictionary ─────────────────────────────────────────────────────
export const translations = {
  en: {
    nav: {
      home: 'Home',
      about: 'About Us',
      blog: 'Blog',
      contact: 'Contact',
      language: 'Language',
      themeLight: 'Light Mode',
      themeDark: 'Dark Mode',
      dashboard: 'Dashboard',
      login: 'Login',
      signup: 'Get Started',
      logout: 'Logout',
      adminPanel: 'Admin Panel',
      profile: 'Profile',
    },
    hero: {
      badge: 'AI-Powered Legal Platform for Nepal',
      title1: 'Your Trusted',
      title2: 'Legal Companion',
      title3: 'for Justice',
      description:
        'न्याय Mitra bridges the gap between citizens and the legal system. Report incidents anonymously, track your case, and get instant AI-powered legal guidance — in your language.',
      ctaPrimary: 'Start Your Case',
      ctaSecondary: 'Learn More',
      card1Title: 'AI Consultant',
      card1Status: 'Online & Secure',
      card2Title: 'Case Readiness',
      card2Value: '98.4% Accuracy',
      card3Title: 'Fully Encrypted',
      card3Sub: 'End-to-End Privacy',
    },
    stats: {
      citizens: 'Citizens Assisted',
      accuracy: 'AI Accuracy Rate',
      resolved: 'Cases Guided',
      anonymity: 'Anonymity Assured',
    },
    features: {
      heading: 'Everything You Need',
      subheading:
        'A complete legal-tech ecosystem designed to reduce friction, support transparency, and restore trust in the justice system.',
      ai: {
        title: 'AI Legal Assistant',
        desc: 'Get instant legal advice, document checklists, and case readiness analysis powered by Gemini AI — 24/7.',
      },
      community: {
        title: 'Community Support',
        desc: 'Connect with a supportive network. Share anonymously, read peer stories, and find solidarity in legal disputes.',
      },
      lawyer: {
        title: 'Lawyer Mentorship',
        desc: 'Access verified panel lawyers for professional guidance, consultation, and legal representation.',
      },
      complaint: {
        title: 'Complaint Guidance',
        desc: 'Receive step-by-step automated checklists to properly structure and submit legal complaints.',
      },
      lang: {
        title: 'Language Accessibility',
        desc: 'Fully bilingual — English and Nepali. Switch instantly, no page reload required.',
      },
      awareness: {
        title: 'Resources & Awareness',
        desc: 'Explore human rights articles, legal definitions, and sections from the Constitution of Nepal.',
      },
    },
    about: {
      heading: 'About Our Mission',
      subheading:
        'Working towards legal empowerment, accessibility, and transparency for every citizen in Nepal.',
      mission: {
        title: 'Our Mission',
        desc: 'To democratize access to legal knowledge and rights guidance through AI technology and community networks.',
      },
      vision: {
        title: 'Our Vision',
        desc: 'A society where legal aid is a fundamental right — not a privilege — and every citizen confidently knows their rights.',
      },
      values: {
        title: 'Our Values',
        desc: 'We uphold strict anonymity, radical transparency, community trust, and absolute equity in resolving civil grievances.',
      },
      impact: {
        title: 'Our Impact',
        desc: 'Eliminating barriers to justice, reducing legal friction, and empowering citizens to file ready-to-submit claims.',
      },
    },
    blog: {
      heading: 'Legal Insights & News',
      subheading: 'Stay informed with the latest updates in law, justice, and citizen rights.',
      readMore: 'Read More',
      posts: [
        {
          tag: 'Constitutional Rights',
          title: 'Understanding Article 18: Right to Equality in Nepal',
          excerpt:
            'Article 18 of the Nepal Constitution guarantees the right to equality before law. Learn how it protects every citizen from discrimination.',
          date: 'June 10, 2026',
          readTime: '4 min read',
        },
        {
          tag: 'Legal Aid',
          title: 'How AI Is Transforming Legal Access for Rural Communities',
          excerpt:
            'AI-powered tools are now helping rural Nepali citizens access legal information that was previously only available to the privileged.',
          date: 'June 8, 2026',
          readTime: '5 min read',
        },
        {
          tag: 'Human Rights',
          title: 'Filing a Complaint: Step-by-Step Guide for Nepali Citizens',
          excerpt:
            'A practical guide to filing civil rights complaints, including documentation requirements and what to expect from the process.',
          date: 'June 5, 2026',
          readTime: '6 min read',
        },
      ],
    },
    testimonials: {
      heading: 'Stories of Justice',
      subheading: 'Real experiences from citizens who found clarity and support through न्याय Mitra.',
      items: [
        {
          quote:
            "I had no idea where to start with my land dispute. The AI assistant walked me through every step and even helped me prepare my complaint documents.",
          name: 'Rama Devi Shrestha',
          role: 'Citizen, Pokhara',
        },
        {
          quote:
            "The community support section gave me hope. I found others who had faced similar issues and learned from their experiences.",
          name: 'Bikash Tamang',
          role: 'Citizen, Chitwan',
        },
        {
          quote:
            "Being able to report anonymously was crucial for me. I trusted the platform completely and the case readiness score helped me understand my situation.",
          name: 'Anonymous',
          role: 'Verified User',
        },
      ],
    },
    contact: {
      heading: 'Get In Touch',
      subheading: 'Have questions or need support? We are here to help.',
      email: 'Email Address',
      phone: 'Phone Number',
      address: 'Office Address',
      socials: 'Follow Us',
      formName: 'Full Name',
      formEmail: 'Email Address',
      formMessage: 'Your Message',
      formSend: 'Send Message',
      formPlaceholderName: 'Your full name',
      formPlaceholderEmail: 'your@email.com',
      formPlaceholderMessage: 'How can we help you?',
    },
    footer: {
      mission: 'Empowering citizens with accessible legal knowledge and support.',
      quickLinks: 'Quick Links',
      services: 'Services',
      contactInfo: 'Contact',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      rights: 'All Rights Reserved.',
      tagline: 'Justice for All. Knowledge for Everyone.',
    },
    auth: {
      loginTitle: 'Welcome Back',
      loginSubtitle: 'Sign in to your न्याय Mitra account',
      signupTitle: 'Join न्याय Mitra',
      signupSubtitle: 'Create your account and access justice today',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign In',
      createAccount: 'Create Account',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      signUpLink: 'Sign up here',
      signInLink: 'Sign in here',
      signingIn: 'Signing in…',
      creating: 'Creating account…',
      showPassword: 'Show',
      hidePassword: 'Hide',
      backToHome: 'Back to Home',
      passwordStrength: 'Password strength',
      strengthWeak: 'Weak',
      strengthFair: 'Fair',
      strengthGood: 'Good',
      strengthStrong: 'Strong',
      verifyTitle: 'Check Your Email',
      verifySubtitle: 'We sent a verification link to',
      resendEmail: 'Resend verification email',
      resendIn: 'Resend in',
      seconds: 'seconds',
      verifySuccess: 'Email verified successfully!',
    },
    common: {
      loading: 'Loading…',
      backToHome: 'Back to Home',
    },
  },

  ne: {
    nav: {
      home: 'गृह पृष्ठ',
      about: 'हाम्रो बारेमा',
      blog: 'ब्लग',
      contact: 'सम्पर्क',
      language: 'भाषा',
      themeLight: 'उज्यालो मोड',
      themeDark: 'अँध्यारो मोड',
      dashboard: 'ड्यासबोर्ड',
      login: 'लगइन',
      signup: 'सुरु गर्नुहोस्',
      logout: 'लगआउट',
      adminPanel: 'प्रशासक',
      profile: 'प्रोफाइल',
    },
    hero: {
      badge: 'नेपालका लागि एआई-चालित कानुनी प्लेटफर्म',
      title1: 'तपाईंको विश्वसनीय',
      title2: 'कानुनी साथी',
      title3: 'न्यायका लागि',
      description:
        'न्याय Mitra नागरिक र कानुनी प्रणालीबीचको खाडल पुर्‍याउँछ। बेनामी रूपमा घटनाहरू दर्ता गर्नुहोस्, केस ट्र्याक गर्नुहोस् र तपाईंको भाषामा तत्काल एआई कानुनी मार्गदर्शन प्राप्त गर्नुहोस्।',
      ctaPrimary: 'आफ्नो मुद्दा सुरु गर्नुहोस्',
      ctaSecondary: 'थप जान्नुहोस्',
      card1Title: 'एआई सल्लाहकार',
      card1Status: 'अनलाइन र सुरक्षित',
      card2Title: 'केस तयारी',
      card2Value: '९८.४% सटीकता',
      card3Title: 'पूर्ण एन्क्रिप्टेड',
      card3Sub: 'अन्त-देखि-अन्त गोपनीयता',
    },
    stats: {
      citizens: 'सहायता प्राप्त नागरिक',
      accuracy: 'एआई सटीकता दर',
      resolved: 'मार्गदर्शन गरिएका केस',
      anonymity: 'गोपनीयता निश्चित',
    },
    features: {
      heading: 'सबै कुरा एकै ठाउँमा',
      subheading:
        'कानुनी जटिलता कम गर्न, पारदर्शिता बढाउन र न्याय प्रणालीमाथिको विश्वास पुनर्स्थापना गर्न एकीकृत कानुनी-प्रविधि प्रणाली।',
      ai: {
        title: 'एआई कानुनी सहायक',
        desc: 'जेमिनी एआईद्वारा सञ्चालित तत्काल कानुनी सल्लाह, कागजात जाँचसूची र केस तयारी विश्लेषण — २४/७।',
      },
      community: {
        title: 'सामुदायिक सहयोग',
        desc: 'सहयोगी नेटवर्कसँग जोडिनुहोस्। बेनामी रूपमा साझा गर्नुहोस् र कानुनी विवादमा साथ पाउनुहोस्।',
      },
      lawyer: {
        title: 'वकिल परामर्श',
        desc: 'व्यावसायिक मार्गदर्शन र कानुनी प्रतिनिधित्वका लागि प्रमाणित वकिलहरूसँग पहुँच पाउनुहोस्।',
      },
      complaint: {
        title: 'उजुरी मार्गदर्शन',
        desc: 'कानुनी उजुरी ठीकसँग संरचना गर्न र पेस गर्न चरण-दर-चरण स्वचालित जाँचसूचीहरू प्राप्त गर्नुहोस्।',
      },
      lang: {
        title: 'भाषा पहुँच',
        desc: 'पूर्ण द्विभाषिक — अंग्रेजी र नेपाली। तुरुन्त स्विच गर्नुहोस्, पृष्ठ पुनः लोड आवश्यक छैन।',
      },
      awareness: {
        title: 'स्रोत र चेतना',
        desc: 'मानव अधिकार लेखहरू, कानुनी परिभाषाहरू र नेपालको संविधानका धाराहरू अन्वेषण गर्नुहोस्।',
      },
    },
    about: {
      heading: 'हाम्रो लक्ष्यको बारेमा',
      subheading:
        'नेपालका प्रत्येक नागरिकका लागि कानुनी सशक्तीकरण, पहुँच र पारदर्शिताको लागि काम गर्दै।',
      mission: {
        title: 'हाम्रो उद्देश्य',
        desc: 'एआई प्रविधि र सामुदायिक सञ्जालहरू मार्फत कानुनी ज्ञान र अधिकार मार्गदर्शनमा सबैको पहुँच पुर्‍याउनु।',
      },
      vision: {
        title: 'हाम्रो परिकल्पना',
        desc: 'यस्तो समाज जहाँ कानुनी सहायता आधारभूत अधिकार हो र प्रत्येक नागरिकले आत्मविश्वासका साथ आफ्नो अधिकार जान्दछन्।',
      },
      values: {
        title: 'हाम्रा मान्यता',
        desc: 'हामी कडा गोपनीयता, पारदर्शिता, सामुदायिक विश्वास र नागरिक गुनासो समाधानमा पूर्ण समता कायम राख्छौं।',
      },
      impact: {
        title: 'हाम्रो प्रभाव',
        desc: 'न्यायमा पहुँचका बाधाहरू हटाउँदै, कानुनी जटिलता घटाउँदै र नागरिकहरूलाई मुद्दा दायर गर्न तयार बनाउँदै।',
      },
    },
    blog: {
      heading: 'कानुनी अन्तर्दृष्टि र समाचार',
      subheading: 'कानून, न्याय र नागरिक अधिकारमा नवीनतम अपडेटहरूसँग सूचित रहनुहोस्।',
      readMore: 'थप पढ्नुहोस्',
      posts: [
        {
          tag: 'संवैधानिक अधिकार',
          title: 'धारा १८ बुझ्नुहोस्: नेपालमा समानताको अधिकार',
          excerpt: 'नेपाल संविधानको धारा १८ ले कानुनी समानताको अधिकार सुनिश्चित गर्दछ। यसले प्रत्येक नागरिकलाई भेदभावबाट कसरी जोगाउँछ जान्नुहोस्।',
          date: 'जुन १०, २०२६',
          readTime: '४ मिनेट',
        },
        {
          tag: 'कानुनी सहायता',
          title: 'एआईले ग्रामीण समुदायहरूका लागि कानुनी पहुँच कसरी बदलिरहेको छ',
          excerpt: 'एआई-चालित उपकरणहरूले अब ग्रामीण नेपाली नागरिकहरूलाई पहिले मात्र सुविधासम्पन्नहरूलाई उपलब्ध कानुनी जानकारी पहुँच गर्न मद्दत गर्दैछन्।',
          date: 'जुन ८, २०२६',
          readTime: '५ मिनेट',
        },
        {
          tag: 'मानव अधिकार',
          title: 'उजुरी दर्ता गर्दै: नेपाली नागरिकहरूका लागि चरण-दर-चरण मार्गदर्शन',
          excerpt: 'नागरिक अधिकार उजुरी दर्ता गर्नका लागि व्यावहारिक मार्गदर्शन, कागजात आवश्यकताहरू र प्रक्रियाबाट के अपेक्षा गर्ने।',
          date: 'जुन ५, २०२६',
          readTime: '६ मिनेट',
        },
      ],
    },
    testimonials: {
      heading: 'न्यायका कथाहरू',
      subheading: 'न्याय Mitra मार्फत स्पष्टता र सहयोग पाएका नागरिकहरूका वास्तविक अनुभवहरू।',
      items: [
        {
          quote: 'मेरो जग्गा विवादमा कहाँबाट सुरु गर्ने कुनै ज्ञान थिएन। एआई सहायकले मलाई हरेक चरणमा मार्गदर्शन गर्‍यो र उजुरी कागजात तयार गर्न समेत मद्दत गर्‍यो।',
          name: 'रामा देवी श्रेष्ठ',
          role: 'नागरिक, पोखरा',
        },
        {
          quote: 'सामुदायिक सहयोग खण्डले मलाई आशा दियो। मैले समान समस्याहरूको सामना गरेका अरूहरू भेटें र उनीहरूको अनुभवबाट सिकें।',
          name: 'विकास तामाङ',
          role: 'नागरिक, चितवन',
        },
        {
          quote: 'बेनामी रूपमा रिपोर्ट गर्न सक्नु मेरा लागि महत्वपूर्ण थियो। मैले प्लेटफर्ममाथि पूर्ण विश्वास राखें र केस तयारी स्कोरले मेरो अवस्था बुझ्न मद्दत गर्‍यो।',
          name: 'अज्ञात',
          role: 'प्रमाणित प्रयोगकर्ता',
        },
      ],
    },
    contact: {
      heading: 'सम्पर्क गर्नुहोस्',
      subheading: 'प्रश्नहरू छन् वा सहयोग चाहिन्छ? हामी यहाँ छौं।',
      email: 'इमेल ठेगाना',
      phone: 'फोन नम्बर',
      address: 'कार्यालयको ठेगाना',
      socials: 'हामीलाई पछ्याउनुहोस्',
      formName: 'पूरा नाम',
      formEmail: 'इमेल ठेगाना',
      formMessage: 'तपाईंको सन्देश',
      formSend: 'सन्देश पठाउनुहोस्',
      formPlaceholderName: 'तपाईंको पूरा नाम',
      formPlaceholderEmail: 'tapai@email.com',
      formPlaceholderMessage: 'हामी तपाईंलाई कसरी मद्दत गर्न सक्छौं?',
    },
    footer: {
      mission: 'नागरिकहरूलाई सुलभ कानुनी ज्ञान र सहयोगका साथ सशक्त बनाउँदै।',
      quickLinks: 'द्रुत लिङ्कहरू',
      services: 'सेवाहरू',
      contactInfo: 'सम्पर्क',
      privacyPolicy: 'गोपनीयता नीति',
      termsOfService: 'सेवाका सर्तहरू',
      rights: 'सबै अधिकार सुरक्षित छन्।',
      tagline: 'सबैका लागि न्याय। सबैका लागि ज्ञान।',
    },
    auth: {
      loginTitle: 'स्वागत छ',
      loginSubtitle: 'आफ्नो न्याय Mitra खातामा साइन इन गर्नुहोस्',
      signupTitle: 'न्याय Mitra मा सामेल हुनुहोस्',
      signupSubtitle: 'आज आफ्नो खाता बनाउनुहोस् र न्यायमा पहुँच राख्नुहोस्',
      email: 'इमेल ठेगाना',
      password: 'पासवर्ड',
      confirmPassword: 'पासवर्ड पुष्टि गर्नुहोस्',
      fullName: 'पूरा नाम',
      rememberMe: 'मलाई सम्झनुहोस्',
      forgotPassword: 'पासवर्ड बिर्सनुभयो?',
      signIn: 'साइन इन गर्नुहोस्',
      createAccount: 'खाता बनाउनुहोस्',
      noAccount: 'खाता छैन?',
      haveAccount: 'खाता छ?',
      signUpLink: 'यहाँ साइन अप गर्नुहोस्',
      signInLink: 'यहाँ साइन इन गर्नुहोस्',
      signingIn: 'साइन इन हुँदैछ…',
      creating: 'खाता बनाउँदैछ…',
      showPassword: 'देखाउनुहोस्',
      hidePassword: 'लुकाउनुहोस्',
      backToHome: 'गृह पृष्ठमा फर्कनुहोस्',
      passwordStrength: 'पासवर्ड शक्ति',
      strengthWeak: 'कमजोर',
      strengthFair: 'ठीकठाक',
      strengthGood: 'राम्रो',
      strengthStrong: 'बलियो',
      verifyTitle: 'आफ्नो इमेल जाँच गर्नुहोस्',
      verifySubtitle: 'हामीले प्रमाणीकरण लिङ्क पठायौं',
      resendEmail: 'प्रमाणीकरण इमेल पुनः पठाउनुहोस्',
      resendIn: 'पुनः पठाउनुहोस्',
      seconds: 'सेकेन्डमा',
      verifySuccess: 'इमेल सफलतापूर्वक प्रमाणित भयो!',
    },
    common: {
      loading: 'लोड हुँदैछ…',
      backToHome: 'गृह पृष्ठमा फर्कनुहोस्',
    },
  },
} as const;

// ── Nested key accessor ────────────────────────────────────────────────────────
type TranslationDict = typeof translations.en;

function getNestedValue(obj: any, path: string): string {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null) return path;
    current = current[part];
  }
  return typeof current === 'string' ? current : path;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isNepali: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nyaya-language') as Language;
      if (saved === 'en' || saved === 'ne') {
        setLanguageState(saved);
      }
    } catch {
      // localStorage not available (SSR)
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('nyaya-language', lang);
    } catch {}
    // Update html lang attribute for screen readers
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[language] ?? translations.en;
    const val = getNestedValue(dict, key);
    // Fallback to English if key not found in Nepali dict
    if (val === key && language !== 'en') {
      return getNestedValue(translations.en, key);
    }
    return val;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isNepali: language === 'ne' }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};
