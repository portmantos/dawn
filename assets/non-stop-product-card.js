if (!customElements.get('product-card-swatches')) {
  customElements.define(
    'product-card-swatches',
    class ProductCardSwatches extends HTMLElement {
      connectedCallback() {
        this.addEventListener('click', this.onSwatchClick.bind(this));
      }

      onSwatchClick(event) {
        const button = event.target.closest('[data-variant-url]');
        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        const card = this.closest('.product-card-wrapper');
        const image = card?.querySelector('[data-card-primary-image]');
        const imageSource = button.dataset.imageSrc;

        if (image && imageSource) {
          card.dataset.pendingVariantImage = imageSource;
          const nextImage = new Image();
          nextImage.onload = () => {
            if (card.dataset.pendingVariantImage !== imageSource) return;
            image.removeAttribute('srcset');
            image.removeAttribute('sizes');
            image.src = imageSource;
            image.alt = button.dataset.imageAlt || image.alt;
            card.classList.add('is-variant-selected');
          };
          nextImage.src = imageSource;
        }

        card?.querySelectorAll('[data-card-product-link]').forEach((link) => {
          link.href = button.dataset.variantUrl;
        });

        this.querySelectorAll('[data-variant-url]').forEach((swatch) => {
          swatch.setAttribute('aria-pressed', String(swatch === button));
        });
      }
    }
  );
}
