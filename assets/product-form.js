if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');
        this.addOnCheckbox = this.querySelector('[data-non-stop-add-on]');
        this.dynamicCheckout = this.querySelector('.shopify-payment-button');
        this.addOnCheckoutNote = this.querySelector('[data-non-stop-add-on-checkout-note]');

        if (this.addOnCheckbox) {
          this.addOnCheckbox.addEventListener('change', this.onAddOnChange.bind(this));
          this.onAddOnChange();
        }

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }

        const addOnRequest = this.buildAddOnRequest(formData);
        if (addOnRequest) {
          config.headers['Content-Type'] = 'application/json';
          config.body = JSON.stringify(addOnRequest);
        } else {
          config.body = formData;
        }

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (addOnRequest && this.cart.tagName === 'CART-NOTIFICATION') {
              window.location = window.routes.cart_url;
              return;
            }

            const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              }).then(() => {
                CartPerformance.measureFromMarker('add:wait-for-subscribers', startMarker);
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    CartPerformance.measure("add:paint-updated-sections", () => {
                      this.cart.renderContents(response);
                    });
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure("add:paint-updated-sections", () => {
                this.cart.renderContents(response);
              });
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');

            CartPerformance.measureFromEvent("add:user-action", evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      onAddOnChange() {
        const addOnSelected = this.addOnCheckbox?.checked === true;

        if (this.dynamicCheckout) this.dynamicCheckout.hidden = addOnSelected;
        if (this.addOnCheckoutNote) this.addOnCheckoutNote.hidden = !addOnSelected;
      }

      buildAddOnRequest(formData) {
        if (!this.addOnCheckbox?.checked || this.addOnCheckbox.disabled) return null;

        const productVariantId = formData.get('id');
        const addOnVariantId = this.addOnCheckbox.dataset.variantId;
        if (!productVariantId || !addOnVariantId) return null;

        const quantity = this.getProductQuantity(formData);
        const addOnQuantityRatio = Math.max(parseInt(this.addOnCheckbox.dataset.quantityRatio || '1', 10), 1);
        const addOnQuantity = quantity * addOnQuantityRatio;
        const bundleId = `non-stop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const parentProperties = this.getLineItemProperties(formData);

        parentProperties._non_stop_bundle_id = bundleId;
        parentProperties._non_stop_add_on_variant = addOnVariantId;
        parentProperties._non_stop_quantity_ratio = String(addOnQuantityRatio);

        const productItem = {
          id: Number(productVariantId),
          quantity,
          properties: parentProperties,
        };

        const sellingPlan = formData.get('selling_plan');
        if (sellingPlan) productItem.selling_plan = Number(sellingPlan);

        const request = {
          items: [
            productItem,
            {
              id: Number(addOnVariantId),
              quantity: addOnQuantity,
              properties: {
                _non_stop_add_on: 'true',
                _non_stop_bundle_id: bundleId,
                _non_stop_parent_variant: String(productVariantId),
                _non_stop_offer: this.addOnCheckbox.dataset.offerHandle || '',
                _non_stop_quantity_ratio: String(addOnQuantityRatio),
              },
            },
          ],
        };

        if (this.cart) {
          request.sections = this.cart.getSectionsToRender().map((section) => section.id);
          request.sections_url = window.location.pathname;
        }

        return request;
      }

      getProductQuantity(formData) {
        const quantityControl = this.form.elements.namedItem('quantity');
        const quantityValue = quantityControl?.value || formData.get('quantity') || '1';

        return Math.max(parseInt(quantityValue, 10) || 1, 1);
      }

      getLineItemProperties(formData) {
        const properties = {};

        for (const [key, value] of formData.entries()) {
          const propertyMatch = key.match(/^properties\[(.+)]$/);
          if (propertyMatch && value !== '') properties[propertyMatch[1]] = value;
        }

        return properties;
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
