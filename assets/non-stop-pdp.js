class NonStopProductGallery {
  constructor(root) {
    this.root = root;
    this.variants = root.querySelectorAll('[data-variant-gallery]');
    this.bindThumbnails();
    this.bindVariantFallback();
    this.productInfo = root.closest('product-info');
    this.productInfo?.addEventListener('non-stop-variant-change', (event) => this.showVariant(event.detail?.variant?.id));
    this.unsubscribe = typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined'
      ? subscribe(PUB_SUB_EVENTS.variantChange, (event) => this.showVariant(event?.data?.variant?.id))
      : null;
  }

  bindVariantFallback() {
    document.addEventListener('change', (event) => {
      const input = event.target.closest('.non-stop-variant-input:checked');
      if (!input || !input.dataset.galleryVariantId || !this.root.contains(input)) return;
      this.showVariant(input.dataset.galleryVariantId);
    });
  }

  bindThumbnails() {
    this.root.addEventListener('click', (event) => {
      const thumbnail = event.target.closest('[data-gallery-image]');
      if (!thumbnail) return;
      const gallery = thumbnail.closest('[data-variant-gallery]');
      const image = gallery?.querySelector('.non-stop-gallery__main-image');
      if (!image) return;
      image.src = thumbnail.dataset.galleryImage;
      image.srcset = '';
      image.alt = thumbnail.dataset.galleryAlt || image.alt;
      gallery.querySelectorAll('[data-gallery-image]').forEach((item) => item.classList.remove('is-active'));
      thumbnail.classList.add('is-active');
    });
  }

  showVariant(variantId) {
    if (!variantId) return;
    const target = [...this.variants].find((variant) => variant.dataset.variantGallery === String(variantId));
    if (!target) return;
    this.variants.forEach((variant) => variant.classList.toggle('hidden', variant !== target));
    target.querySelector('.non-stop-gallery__thumb')?.click();
  }
}

document.querySelectorAll('[data-non-stop-gallery]').forEach((gallery) => new NonStopProductGallery(gallery));
