/* ====================================
   子持ち婚 LP - JavaScript
   ==================================== */

// ============ パーティクルアニメーション ============
function createParticles() {
  const container = document.getElementById('fv-particles');
  if (!container) return;

  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const x = Math.random() * 100;
    const size = Math.random() * 3 + 1;
    const duration = Math.random() * 10 + 8;
    const delay = Math.random() * 10;
    const opacity = Math.random() * 0.3 + 0.1;

    particle.style.left = x + '%';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.opacity = opacity;
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';

    container.appendChild(particle);
  }
}

// ============ アンケート選択肢 ============
const statusMessages = {
  A: 'シングルマザー・シングルファザーとして子育てに奮闘されている',
  B: '離婚を経験し、新しいパートナーを探されている',
  C: '一人で子育てに全力を注いでいる',
  D: '子育てが落ち着き、第二の人生のパートナーを求めている'
};

function selectOption(element) {
  // すべての選択肢のselectedクラスを除去
  const allOptions = document.querySelectorAll('.quiz-option');
  allOptions.forEach(opt => opt.classList.remove('selected'));

  // クリックされた選択肢にselectedクラスを追加
  element.classList.add('selected');

  const option = element.dataset.option;

  // 結果テキストのカスタマイズ
  const statusElem = document.getElementById('result-user-status');
  if (statusElem) {
    statusElem.textContent = statusMessages[option] + 'あなた';
  }

  // 結果エリアを表示
  const result = document.getElementById('quiz-result');
  if (result) {
    // いったん非表示にしてアニメーションリセット
    result.classList.remove('visible');

    // 少し待ってから表示（アニメーション効果）
    setTimeout(() => {
      result.style.display = 'block';
      // reflow を強制
      result.offsetHeight;
      result.classList.add('visible');

      // 結果セクションにスムーズスクロール
      setTimeout(() => {
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }, 300);
  }
}

// ============ スクロールアニメーション ============
function initScrollAnimations() {
  // animate-on-scroll クラスを動的に付与
  const animateTargets = [
    '#reasons-badge', '#reasons-title', '#reasons-lead',
    '#reason-card-1', '#reason-card-2', '#reason-card-3',
    '#trust-badge', '#trust-title',
    '#trust-card-1', '#trust-card-2',
    '#testimonial-1', '#testimonial-2', '#testimonial-3',
    '#final-cta-content'
  ];

  animateTargets.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('animate-on-scroll');
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        // 一度表示したら監視解除
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// ============ フローティングCTA ============
function initFloatingCTA() {
  const floatingCTA = document.getElementById('floating-cta');
  const fvSection = document.getElementById('first-view');
  const finalCTA = document.getElementById('final-cta');

  if (!floatingCTA || !fvSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.target === fvSection) {
        // FVが見えなくなったらフローティングCTA表示
        if (!entry.isIntersecting) {
          floatingCTA.classList.add('visible');
        } else {
          floatingCTA.classList.remove('visible');
        }
      }
    });
  }, { threshold: 0.1 });

  observer.observe(fvSection);

  // 最終CTAが見えたらフローティングCTAを非表示
  if (finalCTA) {
    const finalObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          floatingCTA.classList.remove('visible');
        }
      });
    }, { threshold: 0.3 });

    finalObserver.observe(finalCTA);
  }
}

// ============ ヘッダースクロール効果 ============
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 100) {
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
    } else {
      header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

// ============ スムーズスクロール ============
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerHeight = document.getElementById('header')?.offsetHeight || 0;
        const targetPosition = target.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============ カウントアップアニメーション ============
function initCountUp() {
  const statNumbers = document.querySelectorAll('.stat-number');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;

        // 数値部分を抽出
        const match = text.match(/^([\d,.]+)/);
        if (match) {
          const targetNum = parseFloat(match[1].replace(/,/g, ''));
          const suffix = text.replace(match[1], '');
          const hasDecimal = match[1].includes('.');
          const decimalPlaces = hasDecimal ? match[1].split('.')[1].length : 0;
          const duration = 1500;
          const startTime = performance.now();

          function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = targetNum * eased;

            if (hasDecimal) {
              el.innerHTML = currentValue.toFixed(decimalPlaces) + suffix;
            } else {
              el.innerHTML = Math.floor(currentValue).toLocaleString() + suffix;
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
        }

        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}

// ============ 初期化 ============
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  initScrollAnimations();
  initFloatingCTA();
  initHeaderScroll();
  initSmoothScroll();
  initCountUp();
});
