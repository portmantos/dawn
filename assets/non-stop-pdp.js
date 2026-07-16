class NonStopProductGallery {
  constructor(root) {
    this.root = root;
    this.variants = root.querySelectorAll('[data-variant-gallery]');
    this.productInfo = root.closest('product-info');
    this.lightbox = root.querySelector('[data-gallery-lightbox]');
    this.lightboxImage = this.lightbox?.querySelector('.non-stop-gallery-lightbox__image');
    this.bindGalleryControls();
    this.bindLightboxControls();
    this.bindVariantFallback();
    this.productInfo?.addEventListener('non-stop-variant-change', (event) => this.showVariant(event.detail?.variant?.id));
    this.unsubscribe = typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined'
      ? subscribe(PUB_SUB_EVENTS.variantChange, (event) => this.showVariant(event?.data?.variant?.id))
      : null;
  }

  bindVariantFallback() {
    this.productInfo?.addEventListener('change', (event) => {
      const input = event.target.closest('.non-stop-variant-input:checked');
      if (!input || !input.dataset.galleryVariantId) return;
      this.showVariant(input.dataset.galleryVariantId);
    });
  }

  bindGalleryControls() {
    this.root.addEventListener('click', (event) => {
      const closeButton = event.target.closest('[data-gallery-lightbox-close]');
      if (closeButton) {
        this.closeLightbox();
        return;
      }

      const mainButton = event.target.closest('.non-stop-gallery__main');
      if (mainButton) {
        this.openLightbox(mainButton);
        return;
      }

      const thumbnail = event.target.closest('[data-gallery-image]');
      if (thumbnail) {
        this.selectThumbnail(thumbnail);
        return;
      }

      const directionButton = event.target.closest('[data-gallery-previous], [data-gallery-next]');
      if (!directionButton) return;
      const gallery = directionButton.closest('[data-variant-gallery]');
      this.moveGallery(gallery, directionButton.hasAttribute('data-gallery-next') ? 1 : -1);
    });

    this.root.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const thumbnail = event.target.closest('[data-gallery-image]');
      if (!thumbnail) return;
      event.preventDefault();
      const gallery = thumbnail.closest('[data-variant-gallery]');
      this.moveGallery(gallery, event.key === 'ArrowRight' ? 1 : -1, true);
    });
  }

  bindLightboxControls() {
    if (!this.lightbox) return;
    this.lightbox.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.closeLightbox();
    });
  }

  openLightbox(mainButton) {
    if (!this.lightbox || !this.lightboxImage || typeof this.lightbox.showModal !== 'function') return;
    const gallery = mainButton.closest('[data-variant-gallery]');
    const activeThumbnail = gallery?.querySelector('[data-gallery-image].is-active');
    const zoomSource = activeThumbnail?.dataset.galleryZoom || activeThumbnail?.dataset.galleryImage;
    if (!zoomSource) return;

    this.lightboxImage.src = zoomSource;
    this.lightboxImage.srcset = '';
    this.lightboxImage.alt = activeThumbnail.dataset.galleryAlt || '';
    this.lightbox.showModal();
    this.lightbox.querySelector('[data-gallery-lightbox-close]')?.focus();
  }

  closeLightbox() {
    if (this.lightbox?.open) this.lightbox.close();
  }

  selectThumbnail(thumbnail, focus = false) {
    const gallery = thumbnail?.closest('[data-variant-gallery]');
    const image = gallery?.querySelector('.non-stop-gallery__main-image');
    if (!image) return;

    image.src = thumbnail.dataset.galleryImage;
    image.srcset = '';
    image.alt = thumbnail.dataset.galleryAlt || image.alt;
    gallery.querySelectorAll('[data-gallery-image]').forEach((item) => {
      const isActive = item === thumbnail;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-current', String(isActive));
    });
    const counter = gallery.querySelector('[data-gallery-current]');
    if (counter) counter.textContent = String(Number(thumbnail.dataset.galleryIndex || 0) + 1);
    thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    if (focus) thumbnail.focus();
  }

  moveGallery(gallery, direction, focus = false) {
    const thumbnails = [...(gallery?.querySelectorAll('[data-gallery-image]') || [])];
    if (thumbnails.length < 2) return;
    const current = Math.max(0, thumbnails.findIndex((thumbnail) => thumbnail.classList.contains('is-active')));
    const next = (current + direction + thumbnails.length) % thumbnails.length;
    this.selectThumbnail(thumbnails[next], focus);
  }

  showVariant(variantId) {
    if (!variantId) return;
    this.showKitVariant(variantId);
    const target = [...this.variants].find((variant) => variant.dataset.variantGallery === String(variantId));
    if (!target) return;
    this.variants.forEach((variant) => variant.classList.toggle('hidden', variant !== target));
    this.selectThumbnail(target.querySelector('.non-stop-gallery__thumb'));
  }

  showKitVariant(variantId) {
    const kitRoot = this.productInfo?.querySelector('[data-non-stop-kit-components]');
    if (!kitRoot) return;
    const kitVariants = [...kitRoot.querySelectorAll('[data-kit-variant]')];
    const target = kitVariants.find((variant) => variant.dataset.kitVariant === String(variantId));
    kitVariants.forEach((variant) => variant.classList.toggle('hidden', variant !== target));
    kitRoot.classList.toggle('hidden', !target);
  }
}

document.querySelectorAll('[data-non-stop-gallery]').forEach((gallery) => new NonStopProductGallery(gallery));
