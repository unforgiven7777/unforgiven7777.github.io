/**
 * フォトビューワー - スライドショーアプリ
 * 選択した画像を指定間隔で自動切り替え表示
 * スマホ対応版（スワイプ操作、タッチUI）
 */

(function () {
    'use strict';

    // ===== モバイル検出 =====
    const isTouchDevice = () => {
        return ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    };

    const isMobile = isTouchDevice();

    // ===== 状態管理 =====
    const state = {
        images: [],          // { file, url, name } の配列
        currentIndex: 0,
        interval: 5,         // 秒
        isPlaying: false,
        timer: null,
        progressTimer: null,
        progressStart: 0,
        overlayVisible: true,
        overlayTimeout: null,
        activeSlide: 'current', // 'current' | 'next'
        // タッチ/スワイプ状態
        touch: {
            startX: 0,
            startY: 0,
            currentX: 0,
            isDragging: false,
            threshold: 50,     // スワイプと判定する最小距離(px)
        },
        swipeHintShown: false, // スワイプヒントを表示済みか
    };

    // ===== DOM要素 =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        landingScreen: $('#landing-screen'),
        slideshowScreen: $('#slideshow-screen'),
        slideshowContainer: $('#slideshow-container'),
        dropZone: $('#drop-zone'),
        fileInput: $('#file-input'),
        fileInputMobile: $('#file-input-mobile'),
        fileInputAdd: $('#file-input-add'),
        fileInputAddMobile: $('#file-input-add-mobile'),
        btnSelectFiles: $('#btn-select-files'),
        btnSelectImagesMobile: $('#btn-select-images-mobile'),
        btnAddMore: $('#btn-add-more'),
        btnAddMoreMobile: $('#btn-add-more-mobile'),
        btnClear: $('#btn-clear'),
        btnStart: $('#btn-start'),
        previewSection: $('#preview-section'),
        previewGrid: $('#preview-grid'),
        selectedCount: $('#selected-count'),
        intervalInput: $('#interval-input'),
        intervalDisplay: $('#interval-display'),
        btnIntervalUp: $('#btn-interval-up'),
        btnIntervalDown: $('#btn-interval-down'),
        slideCurrent: $('#slide-current'),
        slideNext: $('#slide-next'),
        slideCounter: $('#slide-counter'),
        filenameDisplay: $('#filename-display'),
        speedDisplay: $('#speed-display'),
        progressBar: $('#progress-bar'),
        overlay: $('#slideshow-overlay'),
        btnBack: $('#btn-back'),
        btnFullscreen: $('#btn-fullscreen'),
        btnPrev: $('#btn-prev'),
        btnNext: $('#btn-next'),
        btnPlayPause: $('#btn-play-pause'),
        iconPlay: $('#icon-play'),
        iconPause: $('#icon-pause'),
        swipeHint: $('#swipe-hint'),
    };

    // ===== 初期化 =====
    function init() {
        bindEvents();
        showOverlay();

        // モバイルの場合、ドロップゾーンのクリックをモバイル用に調整
        if (isMobile) {
            dom.dropZone.addEventListener('click', (e) => {
                // ボタンのクリックは個別処理するため、ドロップゾーン自体のクリックでファイル選択
                if (e.target.closest('.btn')) return;
                dom.fileInputMobile.click();
            });
        }
    }

    // ===== イベントバインド =====
    function bindEvents() {
        // ===== ファイル選択 =====
        // PC: フォルダー選択
        if (dom.btnSelectFiles) {
            dom.btnSelectFiles.addEventListener('click', (e) => {
                e.stopPropagation();
                dom.fileInput.click();
            });
        }

        // モバイル: 画像選択
        if (dom.btnSelectImagesMobile) {
            dom.btnSelectImagesMobile.addEventListener('click', (e) => {
                e.stopPropagation();
                dom.fileInputMobile.click();
            });
        }

        // PC: ドロップゾーンクリック（デスクトップのみ）
        if (!isMobile) {
            dom.dropZone.addEventListener('click', () => {
                dom.fileInput.click();
            });
        }

        // PC: フォルダーinput
        dom.fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            e.target.value = '';
        });

        // モバイル: 画像input
        if (dom.fileInputMobile) {
            dom.fileInputMobile.addEventListener('change', (e) => {
                handleFiles(e.target.files);
                e.target.value = '';
            });
        }

        // 追加フォルダー（PC）
        if (dom.btnAddMore) {
            dom.btnAddMore.addEventListener('click', () => {
                dom.fileInputAdd.click();
            });
        }

        // 追加画像（モバイル）
        if (dom.btnAddMoreMobile) {
            dom.btnAddMoreMobile.addEventListener('click', () => {
                dom.fileInputAddMobile.click();
            });
        }

        dom.fileInputAdd.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            e.target.value = '';
        });

        if (dom.fileInputAddMobile) {
            dom.fileInputAddMobile.addEventListener('change', (e) => {
                handleFiles(e.target.files);
                e.target.value = '';
            });
        }

        // ===== ドラッグ＆ドロップ（PCのみ） =====
        if (!isMobile) {
            document.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            document.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            let dragCounter = 0;

            dom.dropZone.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter++;
                dom.dropZone.classList.add('drag-over');
            });

            dom.dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            dom.dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter--;
                if (dragCounter <= 0) {
                    dragCounter = 0;
                    dom.dropZone.classList.remove('drag-over');
                }
            });

            dom.dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter = 0;
                dom.dropZone.classList.remove('drag-over');

                const items = e.dataTransfer.items;
                if (items && items.length > 0) {
                    let hasEntry = false;
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].webkitGetAsEntry) {
                            hasEntry = true;
                            break;
                        }
                    }
                    if (hasEntry) {
                        const files = await getFilesFromDataTransferItems(items);
                        if (files.length > 0) {
                            handleFiles(files);
                            return;
                        }
                    }
                }
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFiles(e.dataTransfer.files);
                }
            });
        }

        // クリア
        dom.btnClear.addEventListener('click', clearImages);

        // 間隔設定
        dom.intervalInput.addEventListener('input', (e) => {
            state.interval = parseInt(e.target.value);
            updateIntervalDisplay();
        });

        dom.btnIntervalUp.addEventListener('click', () => {
            if (state.interval < 30) {
                state.interval++;
                dom.intervalInput.value = state.interval;
                updateIntervalDisplay();
            }
        });

        dom.btnIntervalDown.addEventListener('click', () => {
            if (state.interval > 1) {
                state.interval--;
                dom.intervalInput.value = state.interval;
                updateIntervalDisplay();
            }
        });

        // スライドショー開始
        dom.btnStart.addEventListener('click', startSlideshow);

        // スライドショーコントロール
        dom.btnBack.addEventListener('click', backToLanding);
        dom.btnFullscreen.addEventListener('click', toggleFullscreen);
        dom.btnPrev.addEventListener('click', () => { prevSlide(); showOverlay(); scheduleOverlayHide(); });
        dom.btnNext.addEventListener('click', () => { nextSlide(); showOverlay(); scheduleOverlayHide(); });
        dom.btnPlayPause.addEventListener('click', togglePlayPause);

        // オーバーレイ表示/非表示（PC: マウス操作）
        if (!isMobile) {
            dom.slideshowScreen.addEventListener('mousemove', handleMouseMove);
            dom.slideshowScreen.addEventListener('click', (e) => {
                if (e.target === dom.slideshowScreen ||
                    e.target.classList.contains('slide-img') ||
                    e.target.classList.contains('slideshow-container')) {
                    toggleOverlay();
                }
            });
        }

        // ===== タッチ/スワイプ操作 =====
        if (isMobile) {
            bindTouchEvents();
        }

        // スワイプヒントのタップで非表示
        if (dom.swipeHint) {
            dom.swipeHint.addEventListener('click', () => {
                dom.swipeHint.classList.add('hidden');
                state.swipeHintShown = true;
            });
            dom.swipeHint.addEventListener('touchend', (e) => {
                e.preventDefault();
                dom.swipeHint.classList.add('hidden');
                state.swipeHintShown = true;
            });
        }

        // キーボード操作
        document.addEventListener('keydown', handleKeyboard);

        // ブラウザバック対応（スライドショー中にバックボタンで戻る）
        window.addEventListener('popstate', () => {
            if (dom.slideshowScreen.classList.contains('active')) {
                backToLanding();
            }
        });
    }

    // ===== タッチイベントバインド =====
    function bindTouchEvents() {
        const container = dom.slideshowContainer;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        // スライドショー画面のタップ（オーバーレイ切替）
        dom.slideshowScreen.addEventListener('touchend', (e) => {
            // スワイプ中でなければオーバーレイ切替
            if (!state.touch.isDragging && !e.target.closest('.btn-icon, .btn-nav, .btn-play, .overlay-top, .overlay-bottom, button')) {
                // ヒントが表示中なら何もしない
                if (dom.swipeHint && !dom.swipeHint.classList.contains('hidden')) return;
                toggleOverlay();
            }
        });
    }

    function handleTouchStart(e) {
        if (!dom.slideshowScreen.classList.contains('active')) return;
        // ヒント表示中はスワイプ無効
        if (dom.swipeHint && !dom.swipeHint.classList.contains('hidden')) return;

        const touch = e.touches[0];
        state.touch.startX = touch.clientX;
        state.touch.startY = touch.clientY;
        state.touch.currentX = touch.clientX;
        state.touch.isDragging = false;
    }

    function handleTouchMove(e) {
        if (!dom.slideshowScreen.classList.contains('active')) return;
        if (dom.swipeHint && !dom.swipeHint.classList.contains('hidden')) return;

        const touch = e.touches[0];
        state.touch.currentX = touch.clientX;
        const diffX = touch.clientX - state.touch.startX;
        const diffY = touch.clientY - state.touch.startY;

        // 水平方向の移動が垂直方向より大きければスワイプ判定
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
            state.touch.isDragging = true;
            e.preventDefault(); // 縦スクロール防止
        }
    }

    function handleTouchEnd(e) {
        if (!dom.slideshowScreen.classList.contains('active')) return;
        if (!state.touch.isDragging) return;

        const diffX = state.touch.currentX - state.touch.startX;

        if (Math.abs(diffX) >= state.touch.threshold) {
            if (diffX < 0) {
                // 左スワイプ → 次の画像
                nextSlide();
            } else {
                // 右スワイプ → 前の画像
                prevSlide();
            }
            // スワイプ後にオーバーレイを一時的に表示
            showOverlay();
            scheduleOverlayHide();
        }

        state.touch.isDragging = false;
    }

    function handleTouchCancel() {
        state.touch.isDragging = false;
    }

    // ===== 画像拡張子判定 =====
    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif'];

    function isImageFile(file) {
        if (file.type && file.type.startsWith('image/')) return true;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
    }

    // ===== フォルダーからのファイル取得（ドラッグ＆ドロップ用） =====
    async function getFilesFromDataTransferItems(items) {
        const files = [];

        async function traverseEntry(entry) {
            try {
                if (!entry) return;
                if (entry.isFile) {
                    return new Promise((resolve) => {
                        entry.file((file) => {
                            if (isImageFile(file)) {
                                files.push(file);
                            }
                            resolve();
                        }, () => resolve());
                    });
                } else if (entry.isDirectory) {
                    const reader = entry.createReader();
                    const entries = await new Promise((resolve) => {
                        const allEntries = [];
                        function readEntries() {
                            reader.readEntries((results) => {
                                if (results.length === 0) {
                                    resolve(allEntries);
                                } else {
                                    allEntries.push(...results);
                                    readEntries();
                                }
                            }, () => resolve(allEntries));
                        }
                        readEntries();
                    });
                    for (const ent of entries) {
                        await traverseEntry(ent);
                    }
                }
            } catch (err) {
                console.warn('ファイル走査エラー:', err);
            }
        }

        const promises = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let entry = null;
            if (item.webkitGetAsEntry) {
                entry = item.webkitGetAsEntry();
            } else if (item.getAsEntry) {
                entry = item.getAsEntry();
            }
            if (entry) {
                promises.push(traverseEntry(entry));
            }
        }
        await Promise.all(promises);
        return files;
    }

    // ===== ファイル処理 =====
    function handleFiles(fileList) {
        const files = Array.from(fileList).filter(f => isImageFile(f));
        if (files.length === 0) return;

        // ファイル名順にソート
        files.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

        files.forEach(file => {
            const url = URL.createObjectURL(file);
            state.images.push({
                file,
                url,
                name: file.name,
            });
        });

        updatePreview();
    }

    function clearImages() {
        state.images.forEach(img => URL.revokeObjectURL(img.url));
        state.images = [];
        updatePreview();
    }

    function removeImage(index) {
        URL.revokeObjectURL(state.images[index].url);
        state.images.splice(index, 1);
        updatePreview();
    }

    // ===== プレビュー更新 =====
    function updatePreview() {
        const count = state.images.length;

        if (count === 0) {
            dom.previewSection.classList.add('hidden');
            return;
        }

        dom.previewSection.classList.remove('hidden');
        dom.selectedCount.textContent = `${count}枚の画像を選択`;

        // グリッド描画
        dom.previewGrid.innerHTML = '';
        state.images.forEach((img, i) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
        <img src="${img.url}" alt="${img.name}" draggable="false">
        <button class="remove-btn" data-index="${i}" title="削除">✕</button>
        <span class="item-number">${i + 1}</span>
      `;
            dom.previewGrid.appendChild(item);
        });

        // 削除ボタン
        dom.previewGrid.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(parseInt(btn.dataset.index));
            });
        });
    }

    function updateIntervalDisplay() {
        dom.intervalDisplay.textContent = state.interval;
    }

    // ===== スライドショー =====
    function startSlideshow() {
        if (state.images.length === 0) return;

        state.currentIndex = 0;
        state.isPlaying = true;

        // 画面切替
        dom.landingScreen.classList.remove('active');
        dom.slideshowScreen.classList.add('active');

        // ブラウザ履歴にエントリーを追加（バックボタン対応）
        history.pushState({ slideshow: true }, '');

        // 最初の画像を表示
        showSlide(0);
        updatePlayPauseIcon();
        showOverlay();

        // スワイプヒント表示（モバイルで初回のみ）
        if (isMobile && !state.swipeHintShown && dom.swipeHint) {
            dom.swipeHint.classList.remove('hidden');
            // 3秒後に自動非表示
            setTimeout(() => {
                if (!dom.swipeHint.classList.contains('hidden')) {
                    dom.swipeHint.classList.add('hidden');
                    state.swipeHintShown = true;
                }
            }, 3000);
        }

        // 自動再生開始
        startAutoPlay();

        // オーバーレイを自動非表示
        scheduleOverlayHide();
    }

    function showSlide(index) {
        const img = state.images[index];

        // クロスフェード
        if (state.activeSlide === 'current') {
            dom.slideNext.src = img.url;
            dom.slideNext.classList.add('active');
            dom.slideCurrent.classList.remove('active');
            state.activeSlide = 'next';
        } else {
            dom.slideCurrent.src = img.url;
            dom.slideCurrent.classList.add('active');
            dom.slideNext.classList.remove('active');
            state.activeSlide = 'current';
        }

        // 情報更新
        dom.slideCounter.textContent = `${index + 1} / ${state.images.length}`;
        dom.filenameDisplay.textContent = img.name;
        dom.speedDisplay.textContent = `${state.interval}秒`;
    }

    function nextSlide() {
        state.currentIndex = (state.currentIndex + 1) % state.images.length;
        showSlide(state.currentIndex);

        if (state.isPlaying) {
            restartAutoPlay();
        }
    }

    function prevSlide() {
        state.currentIndex = (state.currentIndex - 1 + state.images.length) % state.images.length;
        showSlide(state.currentIndex);

        if (state.isPlaying) {
            restartAutoPlay();
        }
    }

    function startAutoPlay() {
        stopAutoPlay();
        state.progressStart = Date.now();

        state.timer = setTimeout(() => {
            nextSlide();
        }, state.interval * 1000);

        // プログレスバーのアニメーション
        updateProgressBar();
    }

    function stopAutoPlay() {
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        if (state.progressTimer) {
            cancelAnimationFrame(state.progressTimer);
            state.progressTimer = null;
        }
    }

    function restartAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    function updateProgressBar() {
        const elapsed = Date.now() - state.progressStart;
        const duration = state.interval * 1000;
        const progress = Math.min(elapsed / duration, 1);
        dom.progressBar.style.width = `${progress * 100}%`;

        if (progress < 1 && state.isPlaying) {
            state.progressTimer = requestAnimationFrame(updateProgressBar);
        }
    }

    function togglePlayPause() {
        if (state.isPlaying) {
            pause();
        } else {
            play();
        }
    }

    function play() {
        state.isPlaying = true;
        updatePlayPauseIcon();
        startAutoPlay();
    }

    function pause() {
        state.isPlaying = false;
        updatePlayPauseIcon();
        stopAutoPlay();
        dom.progressBar.style.width = '0%';
    }

    function updatePlayPauseIcon() {
        if (state.isPlaying) {
            dom.iconPlay.classList.add('hidden');
            dom.iconPause.classList.remove('hidden');
        } else {
            dom.iconPlay.classList.remove('hidden');
            dom.iconPause.classList.add('hidden');
        }
    }

    // ===== ナビゲーション =====
    function backToLanding() {
        pause();
        dom.slideshowScreen.classList.remove('active');
        dom.landingScreen.classList.add('active');

        // 全画面解除
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        // スワイプヒントをリセット（非表示に）
        if (dom.swipeHint) {
            dom.swipeHint.classList.add('hidden');
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen();
        }
    }

    // ===== オーバーレイ制御 =====
    function showOverlay() {
        dom.overlay.classList.add('visible');
        state.overlayVisible = true;
    }

    function hideOverlay() {
        dom.overlay.classList.remove('visible');
        state.overlayVisible = false;
    }

    function toggleOverlay() {
        if (state.overlayVisible) {
            hideOverlay();
        } else {
            showOverlay();
            scheduleOverlayHide();
        }
    }

    function scheduleOverlayHide() {
        if (state.overlayTimeout) {
            clearTimeout(state.overlayTimeout);
        }
        state.overlayTimeout = setTimeout(() => {
            if (state.isPlaying) {
                hideOverlay();
            }
        }, 3000);
    }

    function handleMouseMove() {
        if (!state.overlayVisible) {
            showOverlay();
        }
        scheduleOverlayHide();
    }

    // ===== キーボード操作 =====
    function handleKeyboard(e) {
        // スライドショー画面でのみ有効
        if (!dom.slideshowScreen.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextSlide();
                showOverlay();
                scheduleOverlayHide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                prevSlide();
                showOverlay();
                scheduleOverlayHide();
                break;
            case ' ':
                e.preventDefault();
                togglePlayPause();
                showOverlay();
                scheduleOverlayHide();
                break;
            case 'Escape':
                backToLanding();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
        }
    }

    // ===== 画面ロック防止（スライドショー中にスリープさせない） =====
    let wakeLock = null;
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    wakeLock = null;
                });
            }
        } catch (err) {
            // Wake Lock 非対応 or ユーザーが拒否
            console.log('Wake Lock 非対応:', err);
        }
    }

    function releaseWakeLock() {
        if (wakeLock) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    // スライドショー開始時にWake Lock取得
    const originalStartSlideshow = startSlideshow;
    // 上書きではなく、startSlideshowの最後にWake Lockを取得
    // (既に関数内に組み込み済みなので、別途イベントで対応)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && state.isPlaying) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }
    });

    // startSlideshow をラップしてWake Lockを追加
    const _originalBtnStartHandler = () => {
        // startSlideshow() は既にボタンイベントにバインドされている
        requestWakeLock();
    };

    // スライドショー開始後にWake Lock取得
    const observeSlideshow = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target === dom.slideshowScreen) {
                if (dom.slideshowScreen.classList.contains('active')) {
                    requestWakeLock();
                } else {
                    releaseWakeLock();
                }
            }
        });
    });

    observeSlideshow.observe(dom.slideshowScreen, {
        attributes: true,
        attributeFilter: ['class'],
    });

    // ===== 起動 =====
    init();
})();
