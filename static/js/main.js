/**
 * FastDownloader — Premium Frontend Controller
 * Handles: form submission, API calls, result rendering,
 *          scroll reveal, nav scroll state, preview tabs,
 *          magnetic buttons, toast notifications.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ─── API Base URL (Set Railway domain for Vercel -> Railway backend) ─
    const API_BASE_URL = window.RAILWAY_BACKEND_URL || '';

    // ─── DOM References ──────────────────────────────────────
    const urlForm          = document.getElementById('url-form');
    const urlInput         = document.getElementById('video-url-input');
    const pasteBtn         = document.getElementById('paste-btn');
    const clearBtn         = document.getElementById('clear-btn');
    const submitBtn        = document.getElementById('submit-btn');

    const loadingSection   = document.getElementById('loading-section');
    const statusStepText   = document.getElementById('status-step-text');
    const progressBar      = document.getElementById('progress-bar');
    const progressPercent  = document.getElementById('progress-percent');

    const resultSection    = document.getElementById('result-section');
    const videoThumbnail   = document.getElementById('video-thumbnail');
    const videoDuration    = document.getElementById('video-duration');
    const videoPlatformTag = document.getElementById('video-platform-tag');
    const videoTitle       = document.getElementById('video-title');
    const videoAuthor      = document.getElementById('video-author');
    const qualitiesContainer = document.getElementById('qualities-container');
    const mainDownloadBtn  = document.getElementById('main-download-btn');
    const mainAudioBtn     = document.getElementById('main-audio-btn');
    const downloadAnotherBtn = document.getElementById('download-another-btn');

    const nav              = document.getElementById('nav');


    // ─── Nav Scroll State — rAF-throttled to avoid forced layout on every scroll ─
    let scrollTicking = false;
    const onScroll = () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 20) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });


    // ─── Scroll Reveal ────────────────────────────────────────
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ─── Preview Quality Tabs (Hero mockup) ───────────────────
    const qualityTabs = document.querySelectorAll('.q-tab');
    qualityTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            qualityTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
        tab.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tab.click();
            }
        });
    });


    // ─── Input: Clear Button Visibility ──────────────────────
    urlInput.addEventListener('input', () => {
        if (urlInput.value.trim().length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    });

    clearBtn.addEventListener('click', () => {
        urlInput.value = '';
        clearBtn.classList.add('hidden');
        urlInput.focus();
    });


    // ─── Paste from Clipboard ─────────────────────────────────
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                urlInput.value = text.trim();
                clearBtn.classList.remove('hidden');
                urlInput.focus();
                showToast('Link pasted from clipboard.', 'info');
            } else {
                showToast('Clipboard is empty.', 'error');
            }
        } catch {
            showToast('Could not access clipboard — please paste manually.', 'error');
        }
    });


    // ─── Auto-detect paste via keyboard ──────────────────────
    urlInput.addEventListener('paste', () => {
        setTimeout(() => {
            if (urlInput.value.trim().length > 0) {
                clearBtn.classList.remove('hidden');
            }
        }, 0);
    });


    // ─── Form Submission ──────────────────────────────────────
    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();

        if (!url) {
            showToast('Please enter a valid video URL.', 'error');
            urlInput.focus();
            return;
        }

        // Hide any previous result
        resultSection.classList.add('hidden');

        // Start loading animation
        startLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.detail || 'Failed to process video. Please check your link.');
            }

            finishLoading(() => {
                renderResult(data);
                showToast('Media extracted successfully!', 'success');
            });

        } catch (err) {
            stopLoading();
            showToast(err.message || 'Server error. Please try again.', 'error');
        }
    });


    // ─── Download Another Button ──────────────────────────────
    downloadAnotherBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        urlInput.value = '';
        clearBtn.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => urlInput.focus(), 500);
    });


    // ─── Loading Animation ────────────────────────────────────
    let loadingInterval = null;

    function startLoading() {
        loadingSection.classList.remove('hidden');
        loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        submitBtn.disabled = true;

        const steps = [
            { text: 'Connecting to server…',    pct: 15 },
            { text: 'Resolving video URL…',      pct: 40 },
            { text: 'Analyzing media streams…',  pct: 65 },
            { text: 'Preparing download links…', pct: 85 },
            { text: 'Almost ready…',             pct: 95 }
        ];

        let stepIdx = 0;
        setLoadingStep(steps[0]);

        loadingInterval = setInterval(() => {
            stepIdx++;
            if (stepIdx < steps.length) {
                setLoadingStep(steps[stepIdx]);
            }
        }, 700);
    }

    function setLoadingStep({ text, pct }) {
        statusStepText.textContent = text;
        progressBar.style.width   = `${pct}%`;
        progressPercent.textContent = `${pct}%`;

        // Update ARIA
        const track = progressBar.closest('[role="progressbar"]');
        if (track) track.setAttribute('aria-valuenow', pct);
    }

    function finishLoading(callback) {
        clearInterval(loadingInterval);
        setLoadingStep({ text: 'Complete!', pct: 100 });
        setTimeout(() => {
            stopLoading();
            if (callback) callback();
        }, 350);
    }

    function stopLoading() {
        clearInterval(loadingInterval);
        loadingSection.classList.add('hidden');
        submitBtn.disabled = false;
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
    }


    // ─── Render Result Card ───────────────────────────────────
    function renderResult(data) {

        // Thumbnail
        videoThumbnail.src = data.thumbnail || '';
        videoThumbnail.alt = `Thumbnail for: ${data.title || 'Video'}`;

        // Meta
        videoDuration.textContent    = data.duration  || 'N/A';
        videoPlatformTag.textContent = data.platform  || 'Video';
        videoTitle.textContent       = data.title     || 'Untitled Video';

        const authorSpan = videoAuthor.querySelector('span');
        if (authorSpan) {
            authorSpan.textContent = `Uploaded by: ${data.author || 'Unknown'}`;
        }

        // Main action buttons
        const topAudioUrl = data.qualities?.[0]?.audio_url ?? data.audio_url ?? '';
        mainDownloadBtn.onclick = () => triggerDownload(data.download_url, data.title, 'mp4', topAudioUrl);
        mainAudioBtn.onclick    = () => triggerDownload(data.audio_url || data.download_url, data.title, 'mp3');

        // Quality rows
        qualitiesContainer.innerHTML = '';

        if (data.qualities && data.qualities.length > 0) {
            data.qualities.forEach(q => {
                const isAudio  = q.is_audio || q.format === 'MP3';
                const iconType = isAudio ? 'audio-type' : 'video-type';
                const icon     = isAudio ? 'fa-music'   : 'fa-film';
                const badgeCls = isAudio ? 'badge-audio' : 'badge-video';

                const row = document.createElement('div');
                row.className = 'quality-row';
                row.setAttribute('role', 'listitem');

                row.innerHTML = `
                    <div class="quality-info">
                        <div class="quality-icon ${iconType}" aria-hidden="true">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="quality-labels">
                            <div class="quality-name">
                                ${escapeHtml(q.quality)}
                                <span class="quality-badge ${badgeCls}">${escapeHtml(q.format)}</span>
                            </div>
                            <div class="quality-meta">
                                ${q.resolution ? escapeHtml(q.resolution) + ' &nbsp;·&nbsp; ' : ''}${q.size ? escapeHtml(q.size) : ''}
                            </div>
                        </div>
                    </div>
                    <button
                        class="quality-dl-btn"
                        data-url="${escapeAttr(q.url)}"
                        data-audio-url="${escapeAttr(q.audio_url || '')}"
                        data-format="${escapeAttr(q.format.toLowerCase())}"
                        aria-label="Download ${escapeAttr(q.quality)} ${escapeAttr(q.format)}"
                    >
                        <i class="fas fa-download" aria-hidden="true"></i>
                        Download
                    </button>
                `;

                row.querySelector('.quality-dl-btn').addEventListener('click', function () {
                    triggerDownload(
                        this.dataset.url,
                        data.title,
                        this.dataset.format,
                        this.dataset.audioUrl
                    );
                });

                qualitiesContainer.appendChild(row);
            });
        } else {
            qualitiesContainer.innerHTML = `
                <div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">
                    No additional quality options available.
                </div>
            `;
        }

        // Show result
        resultSection.classList.remove('hidden');
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }


    // ─── Download Trigger ─────────────────────────────────────
    function triggerDownload(mediaUrl, filename, format, audioUrl = '') {
        if (!mediaUrl) {
            showToast('Download URL not available.', 'error');
            return;
        }
        showToast(`Starting ${format.toUpperCase()} download…`, 'info');
        let endpoint = `${API_BASE_URL}/proxy-download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename || 'video')}&ext=${format}`;
        if (audioUrl && format.toLowerCase() === 'mp4') {
            endpoint += `&audio_url=${encodeURIComponent(audioUrl)}`;
        }
        window.location.href = endpoint;
    }


    // ─── Toast System ─────────────────────────────────────────
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.setAttribute('aria-live', 'assertive');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        const icons = {
            error:   'fa-circle-exclamation',
            success: 'fa-circle-check',
            info:    'fa-circle-info'
        };
        const colors = {
            error:   '#F87171',
            success: 'var(--accent-emerald)',
            info:    'var(--accent-blue)'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}" style="color:${colors[type] || colors.info}; font-size:15px; flex-shrink:0;" aria-hidden="true"></i>
            <span style="flex:1; font-size:13px;">${escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Dismiss notification">&times;</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
        container.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });

        // Auto-dismiss after 4.5 s
        const timer = setTimeout(() => dismissToast(toast), 4500);
        toast._timer = timer;
    }

    function dismissToast(toast) {
        clearTimeout(toast._timer);
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 420);
    }


    // ─── Helpers ──────────────────────────────────────────────
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        if (!str) return '';
        return String(str).replace(/"/g, '&quot;');
    }


    // ─── Magnetic Submit Button ───────────────────────────────
    // Removed: mousemove forces layout reads every frame on mid-range hardware.
    // Hover state is handled entirely by CSS (translateX on .submit-arrow).


    // ─── Smooth Anchor Scrolling ──────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').slice(1);
            const target   = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    // ─── Kick off initial reveal for above-fold elements ─────
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('visible');
            }
        });
    }, 50);

});
