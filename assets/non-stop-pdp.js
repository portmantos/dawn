class NonStopProductGallery {
  constructor(root) {
    this.root = root;
    this.variants = root.querySelectorAll('[data-variant-gallery]');
    this.productInfo = root.closest('product-info');
    this.bindGalleryControls();
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
    const target = [...this.variants].find((variant) => variant.dataset.variantGallery === String(variantId));
    if (!target) return;
    this.variants.forEach((variant) => variant.classList.toggle('hidden', variant !== target));
    this.selectThumbnail(target.querySelector('.non-stop-gallery__thumb'));
  }
}

document.querySelectorAll('[data-non-stop-gallery]').forEach((gallery) => new NonStopProductGallery(gallery));
