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

        this.updatePrice(card, button);

        this.querySelectorAll('[data-variant-url]').forEach((swatch) => {
          swatch.setAttribute('aria-pressed', String(swatch === button));
        });
      }

      updatePrice(card, button) {
        const price = card?.querySelector('[data-card-variant-price] .price');
        if (!price || !button.dataset.variantPrice) return;

        const isOnSale = button.dataset.variantOnSale === 'true';
        const regularPrice = price.querySelector('.price__regular .price-item--regular');
        const salePrice = price.querySelector('.price__sale .price-item--sale');
        const compareAtPrice = price.querySelector('.price__sale .price-item--regular');

        price.classList.toggle('price--on-sale', isOnSale);
        if (isOnSale) price.classList.remove('price--no-compare');
        if (regularPrice) regularPrice.textContent = button.dataset.variantPrice;
        if (salePrice) salePrice.textContent = button.dataset.variantPrice;
        if (compareAtPrice && isOnSale) compareAtPrice.textContent = button.dataset.variantCompareAtPrice;
      }
    }
  );
}
