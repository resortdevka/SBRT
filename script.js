const mutedIcon = String.fromCodePoint(0x1f507);
const unmutedIcon = String.fromCodePoint(0x1f50a);

function initAnimations() {
    if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);

        window.gsap.from('.hero-content > *', {
            y: 40,
            opacity: 0,
            stagger: .15,
            duration: 1.1,
            ease: 'power3.out'
        });

        document.querySelectorAll('.reveal').forEach(function (el) {
            window.gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: .9,
                ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 80%' }
            });
        });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
}

function initCursorGlow() {
    var glow = document.querySelector('.cursor-glow');
    if (!glow) return;

    window.addEventListener('pointermove', function (e) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }, { passive: true });
}

function initOceanCanvas() {
    var canvas = document.getElementById('ocean-canvas');
    if (!canvas || !window.THREE) return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, .1, 100);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 7;

    var geometry = new THREE.PlaneGeometry(20, 12, 128, 128);
    var material = new THREE.MeshBasicMaterial({
        color: 0x0d2e5f,
        wireframe: true,
        transparent: true,
        opacity: .25
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -1.2;
    mesh.position.y = -2;
    scene.add(mesh);

    var pointsGeometry = new THREE.BufferGeometry();
    var count = 250;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - .5) * 18;
        positions[i + 1] = (Math.random() - .5) * 8;
        positions[i + 2] = (Math.random() - .5) * 8;
    }

    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var cloud = new THREE.Points(pointsGeometry, new THREE.PointsMaterial({
        color: 0xffcf85,
        size: .04,
        transparent: true,
        opacity: .65
    }));
    scene.add(cloud);

    function animate(time) {
        requestAnimationFrame(animate);
        var position = geometry.attributes.position;

        for (var index = 0; index < position.count; index++) {
            var x = position.getX(index);
            var y = position.getY(index);
            position.setZ(index, Math.sin(x * 1.2 + time * .0017) * .18 + Math.cos(y + time * .0013) * .12);
        }

        position.needsUpdate = true;
        cloud.rotation.y = time * 0.00008;
        renderer.render(scene, camera);
    }
    animate(0);

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function hideBanner() {
    var banner = document.getElementById('audio-banner');
    if (!banner) return;

    banner.style.opacity = '0';
    banner.style.transform = 'translateY(20px)';
    setTimeout(function () {
        banner.style.display = 'none';
    }, 420);
}

function setMuteButtonState(btn, isMuted) {
    btn.textContent = isMuted ? mutedIcon : unmutedIcon;
    btn.setAttribute('aria-label', isMuted ? 'Unmute video' : 'Mute video');
    btn.setAttribute('aria-pressed', String(!isMuted));
}

function setVideoMuted(video, btn, isMuted) {
    video.muted = isMuted;
    video.defaultMuted = isMuted;
    video.volume = isMuted ? 0 : 1;

    if (isMuted) {
        video.setAttribute('muted', '');
    } else {
        video.removeAttribute('muted');
    }

    if (btn) {
        setMuteButtonState(btn, isMuted);
    }
}

function getVideoButton(video) {
    var container = video.closest('.video-container');
    return container ? container.querySelector('.custom-mute-btn') : null;
}

function muteOtherVideos(activeVideo) {
    document.querySelectorAll('.gallery-video').forEach(function (video) {
        if (video === activeVideo) return;
        setVideoMuted(video, getVideoButton(video), true);
    });
}

function enableVideoAudio(video, btn) {
    muteOtherVideos(video);
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    setVideoMuted(video, btn, false);

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
            setVideoMuted(video, btn, true);
            video.controls = true;
        });
    }

    hideBanner();
}

function initMuteButtons() {
    document.querySelectorAll('.video-container').forEach(function (container) {
        var video = container.querySelector('.gallery-video');
        var btn = container.querySelector('.custom-mute-btn');
        if (!video || !btn) return;

        setVideoMuted(video, btn, true);

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (video.muted || video.volume === 0) {
                enableVideoAudio(video, btn);
            } else {
                setVideoMuted(video, btn, true);
            }
        });
    });
}

function applyGalleryImageLayout(img) {
    var parent = img.parentElement;
    if (!parent) return;

    var width = img.naturalWidth || img.width;
    var height = img.naturalHeight || img.height;
    if (!width || !height) return;

    var ratio = width / height;
    parent.classList.remove('landscape', 'portrait', 'square');
    parent.style.setProperty('--media-ratio', width + ' / ' + height);

    if (Math.abs(ratio - 1) < .08) {
        parent.classList.add('square');
    } else if (ratio > 1) {
        parent.classList.add('landscape');
    } else {
        parent.classList.add('portrait');
    }
}

function initGalleryLayout() {
    document.querySelectorAll('.gallery-item img').forEach(function (img) {
        if (img.complete && img.naturalWidth) {
            applyGalleryImageLayout(img);
            return;
        }

        img.addEventListener('load', function () {
            applyGalleryImageLayout(img);
        }, { once: true });
    });
}

function enableAllAudio() {
    var firstVideo = document.querySelector('.gallery-video');
    if (firstVideo) {
        enableVideoAudio(firstVideo, getVideoButton(firstVideo));
    }
}

function initPage() {
    initAnimations();
    initCursorGlow();
    initOceanCanvas();
    initGalleryLayout();
    initMuteButtons();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
