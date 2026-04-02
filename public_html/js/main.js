/* ============================================
   АльпСила — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // --- Sticky Header ---
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // --- Mobile Menu ---
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Back to Top ---
  const backBtn = document.querySelector('.back-to-top');
  if (backBtn) {
    window.addEventListener('scroll', () => {
      backBtn.classList.toggle('visible', window.scrollY > 400);
    });
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll Animations ---
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    fadeEls.forEach(el => observer.observe(el));
  }

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // --- Calculator ---
  const calcForm = document.getElementById('calculator');
  if (calcForm) {
    const steps = calcForm.querySelectorAll('.calc-step');
    const dots = calcForm.querySelectorAll('.step-dot');
    let current = 0;

    function showStep(n) {
      steps.forEach((s, i) => {
        s.classList.toggle('active', i === n);
        if (dots[i]) dots[i].classList.toggle('active', i <= n);
      });
    }

    calcForm.querySelectorAll('.calc-next').forEach(btn => {
      btn.addEventListener('click', () => {
        if (current < steps.length - 1) {
          current++;
          showStep(current);
        }
      });
    });

    calcForm.querySelectorAll('.calc-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        if (current > 0) {
          current--;
          showStep(current);
        }
      });
    });

    const calcBtn = calcForm.querySelector('.calc-compute');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        const service = calcForm.querySelector('[name="calc-service"]');
        const area = calcForm.querySelector('[name="calc-area"]');
        const result = calcForm.querySelector('.result-price');
        if (service && area && result) {
          const prices = {
            'mojka': 55, 'pokraska': 350, 'germetizaciya': 350,
            'uteplenie': 1800, 'gidroizolyaciya': 450, 'remont-krovli': 500,
            'mojka-okon': 45, 'oblicovka': 2500, 'vitrazhi': 600,
            'antikorroziya': 420, 'abonentskoe': 25000
          };
          const pricePerM = prices[service.value] || 300;
          const areaVal = parseFloat(area.value) || 100;
          const total = pricePerM * areaVal;
          result.textContent = 'от ' + total.toLocaleString('ru-RU') + ' ₽';
        }
        current = steps.length - 1;
        showStep(current);
      });
    }
  }

  // --- Callback Modal ---
  const modalOverlay = document.querySelector('.modal-overlay');
  const openModalBtns = document.querySelectorAll('[data-modal="callback"]');
  const closeModalBtn = document.querySelector('.modal-close');

  if (modalOverlay) {
    openModalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // --- Form submission ---
  document.querySelectorAll('form').forEach(form => {
    // Пропускаем calc-форму (не отправляется)
    if (form.closest('#calculator')) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;

      // Блокируем кнопку
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Отправляем…';

      // Собираем данные
      const data = {
        name:    form.querySelector('[name="name"], [placeholder*="имя"], [placeholder*="Имя"]')?.value?.trim() || '',
        phone:   form.querySelector('[name="phone"], [type="tel"]')?.value?.trim() || '',
        service: form.querySelector('[name="service"], select')?.value?.trim() || '',
        message: form.querySelector('[name="message"], textarea')?.value?.trim() || '',
        page:    window.location.href,
        source:  form.dataset.source || 'form',
      };

      try {
        const res = await fetch('/scripts/send.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();

        if (json.ok) {
          btn.textContent = '✓ Заявка принята!';
          btn.style.background = '#22c55e';
          form.reset();
          // Закрываем модалку если открыта
          const modal = form.closest('.modal-overlay');
          if (modal) {
            setTimeout(() => {
              modal.classList.remove('active');
              document.body.style.overflow = '';
            }, 2000);
          }
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = origText;
            btn.style.background = '';
          }, 3000);
        } else {
          throw new Error(json.error || 'Ошибка');
        }
      } catch (err) {
        btn.textContent = '✗ Ошибка. Позвоните нам';
        btn.style.background = '#ef4444';
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = origText;
          btn.style.background = '';
        }, 4000);
      }
    });
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Clickable photos (lightbox) ---
  const lightbox = document.querySelector('.photo-lightbox');
  const lightboxImage = document.querySelector('.photo-lightbox-image');
  const lightboxCaption = document.querySelector('.photo-lightbox-caption');
  const lightboxClose = document.querySelector('.photo-lightbox-close');
  const galleryImages = document.querySelectorAll(
    '.service-media img, .service-showcase-media img, .feature-shot img, .portfolio-card .card-img img, .blog-card .card-img img, .geo-visual > img'
  );

  if (lightbox && lightboxImage && lightboxClose && galleryImages.length) {
    const openLightbox = (img) => {
      lightboxImage.src = img.currentSrc || img.src;
      lightboxImage.alt = img.alt || '';
      lightboxCaption.textContent = img.alt || '';
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImage.src = '';
      lightboxCaption.textContent = '';
      document.body.style.overflow = '';
    };

    galleryImages.forEach(img => {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', (img.alt || 'Открыть фото') + '. Открыть фото');

      img.addEventListener('click', () => openLightbox(img));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(img);
        }
      });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // --- Counter animation ---
  const counters = document.querySelectorAll('.trust-stat .number');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count')) || 0;
          const suffix = el.getAttribute('data-suffix') || '';
          const prefix = el.getAttribute('data-prefix') || '';
          let count = 0;
          const step = Math.max(1, Math.floor(target / 60));
          const timer = setInterval(() => {
            count += step;
            if (count >= target) {
              count = target;
              clearInterval(timer);
            }
            el.textContent = prefix + count.toLocaleString('ru-RU') + suffix;
          }, 25);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  // --- Price filter ---
  const filterBtns = document.querySelectorAll('.price-filter .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      document.querySelectorAll('.price-category').forEach(pc => {
        pc.style.display = (cat === 'all' || pc.getAttribute('data-category') === cat) ? '' : 'none';
      });
    });
  });
});
