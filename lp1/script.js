/**
 * 婚活診断LP - Interactive Quiz Script
 * 30代女性向け 診断型ランディングページ
 */

(function () {
  'use strict';

  // ===========================
  // State Management
  // ===========================
  const state = {
    answers: {},
    currentQuestion: 1,
    totalQuestions: 3,
    completed: false
  };

  // ===========================
  // DOM References
  // ===========================
  const dom = {
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    quizCards: document.querySelectorAll('.quiz-card'),
    resultSection: document.getElementById('result'),
    resultType: document.getElementById('resultType'),
    resultIcon: document.getElementById('resultIcon'),
    resultDescription: document.getElementById('resultDescription'),
    resultCard: document.getElementById('resultCard'),
    solutionSection: document.getElementById('solution'),
    fixedCta: document.getElementById('fixedCta'),
    scrollIndicator: document.getElementById('scrollIndicator')
  };

  // ===========================
  // Type Definitions
  // ===========================
  const types = {
    A: {
      name: '焦り型',
      icon: '⏰',
      className: 'type-a',
      description: `焦りは悪くない。<br>でも、<strong>焦るほど選択を間違えやすい。</strong><br><br>環境を変えるだけで<br>進み方は変わります。`
    },
    B: {
      name: '消耗型',
      icon: '🥀',
      className: 'type-b',
      description: `頑張っているのに報われない。<br><br>それはあなたではなく、<br><strong>出会いの質の問題。</strong><br><br>場所を変えれば、出会いは変わります。`
    },
    C: {
      name: '停滞型',
      icon: '🌀',
      className: 'type-c',
      description: `動きたいのに決め手がない。<br><br>一度整理するだけで、<br><strong>視界が開けます。</strong>`
    }
  };

  // ===========================
  // Initialize
  // ===========================
  function init() {
    updateProgress();
    bindOptionClicks();
    bindScrollIndicator();
  }

  // ===========================
  // Scroll Indicator
  // ===========================
  function bindScrollIndicator() {
    if (dom.scrollIndicator) {
      dom.scrollIndicator.addEventListener('click', function () {
        const quizSection = document.getElementById('quiz');
        if (quizSection) {
          quizSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  // ===========================
  // Quiz Option Clicks
  // ===========================
  function bindOptionClicks() {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(function (option) {
      option.addEventListener('click', function () {
        handleOptionSelect(this);
      });
    });
  }

  function handleOptionSelect(option) {
    const question = parseInt(option.dataset.question);
    const answer = option.dataset.answer;

    // Highlight selected
    const siblings = option.parentElement.querySelectorAll('.quiz-option');
    siblings.forEach(function (sib) {
      sib.classList.remove('selected');
    });
    option.classList.add('selected');

    // Store answer
    state.answers[question] = answer;

    // Delay before transition
    setTimeout(function () {
      if (question < state.totalQuestions) {
        goToNextQuestion(question + 1);
      } else {
        showResult();
      }
    }, 400);
  }

  // ===========================
  // Question Navigation
  // ===========================
  function goToNextQuestion(nextQ) {
    state.currentQuestion = nextQ;

    // Hide all cards
    dom.quizCards.forEach(function (card) {
      card.classList.remove('active');
    });

    // Show next card
    var nextCard = document.getElementById('q' + nextQ);
    if (nextCard) {
      nextCard.classList.add('active');
      nextCard.style.animation = 'none';
      // Force reflow
      void nextCard.offsetHeight;
      nextCard.style.animation = 'fadeInUp 0.5s ease forwards';
    }

    updateProgress();
  }

  // ===========================
  // Progress Bar
  // ===========================
  function updateProgress() {
    var pct = ((state.currentQuestion - 1) / state.totalQuestions) * 100;
    dom.progressFill.style.width = pct + '%';
    dom.progressText.textContent = 'Q' + state.currentQuestion + ' / ' + state.totalQuestions;
  }

  // ===========================
  // Show Result
  // ===========================
  function showResult() {
    if (state.completed) return;
    state.completed = true;

    // Complete progress
    dom.progressFill.style.width = '100%';
    dom.progressText.textContent = '完了！';

    // Calculate type
    var resultType = calculateType();
    var typeData = types[resultType];

    // Populate result
    dom.resultType.textContent = typeData.name;
    dom.resultType.className = 'result-type ' + typeData.className;
    dom.resultIcon.textContent = typeData.icon;
    dom.resultDescription.innerHTML = typeData.description;

    // Show sections
    setTimeout(function () {
      // Hide quiz card
      dom.quizCards.forEach(function (card) {
        card.classList.remove('active');
      });

      // Show result section
      dom.resultSection.style.display = 'block';
      dom.resultSection.scrollIntoView({ behavior: 'smooth' });

      // Create confetti
      createConfetti();

      // Show solution section after a delay
      setTimeout(function () {
        dom.solutionSection.style.display = 'block';
      }, 500);

      // Show fixed CTA
      setTimeout(function () {
        dom.fixedCta.style.display = 'block';
      }, 1500);
    }, 600);
  }

  // ===========================
  // Calculate Type
  // ===========================
  function calculateType() {
    var counts = { A: 0, B: 0, C: 0 };

    Object.values(state.answers).forEach(function (ans) {
      counts[ans]++;
    });

    // Find max
    var maxCount = 0;
    var maxType = 'A';

    Object.keys(counts).forEach(function (type) {
      if (counts[type] > maxCount) {
        maxCount = counts[type];
        maxType = type;
      }
    });

    return maxType;
  }

  // ===========================
  // Confetti Effect
  // ===========================
  function createConfetti() {
    var container = document.getElementById('confetti');
    if (!container) return;

    var colors = ['#e88a7d', '#f0c2b8', '#c9a4a0', '#fde8e4', '#e8d5d2', '#d4c4b8'];

    for (var i = 0; i < 24; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = Math.random() * 30 - 30 + 'px';
      piece.style.animationDelay = Math.random() * 1 + 's';
      piece.style.animationDuration = 1.5 + Math.random() * 1.5 + 's';
      piece.style.width = 6 + Math.random() * 8 + 'px';
      piece.style.height = 6 + Math.random() * 8 + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
    }

    // Cleanup
    setTimeout(function () {
      container.innerHTML = '';
    }, 4000);
  }

  // ===========================
  // Fixed CTA Visibility
  // ===========================
  function handleScroll() {
    if (!state.completed) return;

    var footer = document.querySelector('.site-footer');
    if (!footer) return;

    var footerRect = footer.getBoundingClientRect();
    var windowHeight = window.innerHeight;

    if (footerRect.top < windowHeight) {
      dom.fixedCta.style.opacity = '0';
      dom.fixedCta.style.pointerEvents = 'none';
    } else {
      dom.fixedCta.style.opacity = '1';
      dom.fixedCta.style.pointerEvents = 'auto';
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ===========================
  // Smooth reveal on scroll (intersection observer)
  // ===========================
  function setupScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.solution-card, .solution-message, .cta-final').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // Add revealed class styles
  var style = document.createElement('style');
  style.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);

  // ===========================
  // Boot
  // ===========================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      setupScrollReveal();
    });
  } else {
    init();
    setupScrollReveal();
  }

})();
