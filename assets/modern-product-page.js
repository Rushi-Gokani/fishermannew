/**
 * Modern Product Page JavaScript
 * Handles gallery, zoom, variants, quantity, and add to cart
 */

class ModernProductPage {
  constructor(section) {
    this.section = section;
    this.container = section.querySelector('.modern-product-section');
    this.productJSON = JSON.parse(section.querySelector('[data-product-json]').textContent);

    this.initGallery();
    this.initZoom();
    this.initVariants();
    this.initQuantity();
    this.initAddToCart();
    this.initPickupAvailability();
  }

  // ========== Gallery ==========
  initGallery() {
    this.slides = this.container.querySelectorAll('.modern-gallery__slide');
    this.thumbnails = this.container.querySelectorAll('.modern-gallery__thumbnail');
    this.prevBtn = this.container.querySelector('.modern-gallery__nav--prev');
    this.nextBtn = this.container.querySelector('.modern-gallery__nav--next');
    this.currentIndex = 0;

    // Thumbnail clicks
    this.thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', () => this.goToSlide(index));
    });

    // Arrow navigation
    this.prevBtn?.addEventListener('click', () => this.previousSlide());
    this.nextBtn?.addEventListener('click', () => this.nextSlide());

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
    });

    // Touch swipe support
    this.initSwipe();
  }

  goToSlide(index) {
    if (index < 0) index = this.slides.length - 1;
    if (index >= this.slides.length) index = 0;

    this.currentIndex = index;

    // Update slides
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

    // Update thumbnails
    this.thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('is-active', i === index);
      thumb.setAttribute('aria-current', i === index ? 'true' : 'false');
    });

    // Update counter
    const counter = this.container.querySelector('[data-current-index]');
    if (counter) counter.textContent = index + 1;

    // Update zoom image
    const activeSlide = this.slides[index];
    const hiddenImg = activeSlide?.querySelector('[data-media-src-hidden]');
    const zoomImg = this.container.querySelector('[data-zoom-image]');
    if (hiddenImg && zoomImg) {
      zoomImg.src = hiddenImg.src;
    }
  }

  previousSlide() {
    this.goToSlide(this.currentIndex - 1);
  }

  nextSlide() {
    this.goToSlide(this.currentIndex + 1);
  }

  initSwipe() {
    const viewport = this.container.querySelector('.modern-gallery__viewport');
    const mainGallery = this.container.querySelector('.modern-gallery__main');
    if (!viewport || !mainGallery) return;

    let startX = 0;
    let endX = 0;
    let isDragging = false;

    // Touch events for mobile
    viewport.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      endX = e.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      const diff = startX - endX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.nextSlide();
        else this.previousSlide();
      }
    });

    // Mouse events for desktop drag
    let isMouseDown = false;

    mainGallery.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      startX = e.clientX;
      mainGallery.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      endX = e.clientX;
    });

    document.addEventListener('mouseup', () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      mainGallery.style.cursor = '';
      const diff = startX - endX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.nextSlide();
        else this.previousSlide();
      }
    });

    // Prevent image drag
    viewport.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  // ========== Zoom Modal ==========
  initZoom() {
    this.zoomModal = this.container.querySelector('[data-zoom-modal]');
    if (!this.zoomModal) return;

    this.zoomBackdrop = this.zoomModal.querySelector('[data-close-zoom]');
    this.zoomClose = this.zoomModal.querySelector('.modern-zoom-modal__close');
    this.zoomPrev = this.zoomModal.querySelector('[data-zoom-prev]');
    this.zoomNext = this.zoomModal.querySelector('[data-zoom-next]');
    this.zoomImage = this.zoomModal.querySelector('[data-zoom-image]');

    // Open zoom on image click
    this.container.querySelectorAll('[data-can-zoom]').forEach(wrapper => {
      wrapper.addEventListener('click', () => this.openZoom());
    });

    // Close handlers
    this.zoomBackdrop.addEventListener('click', () => this.closeZoom());
    this.zoomClose?.addEventListener('click', () => this.closeZoom());

    // Navigation in zoom
    this.zoomPrev?.addEventListener('click', () => {
      this.previousSlide();
      this.updateZoomImage();
    });
    this.zoomNext?.addEventListener('click', () => {
      this.nextSlide();
      this.updateZoomImage();
    });

    // Keyboard close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.zoomModal.getAttribute('aria-hidden') === 'false') {
        this.closeZoom();
      }
    });
  }

  openZoom() {
    this.updateZoomImage();
    this.zoomModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  closeZoom() {
    this.zoomModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  updateZoomImage() {
    const activeSlide = this.slides[this.currentIndex];
    const hiddenImg = activeSlide?.querySelector('[data-media-src-hidden]');
    if (hiddenImg && this.zoomImage) {
      this.zoomImage.src = hiddenImg.src;
    }
  }

  // ========== Variants ==========
  initVariants() {
    this.variantSelects = this.container.querySelector('[data-variant-picker]');
    if (!this.variantSelects) return;

    this.variantInputs = this.variantSelects.querySelectorAll('input[name^="option"]');

    this.variantInputs.forEach(input => {
      input.addEventListener('change', () => this.handleVariantChange());
    });

    // Swatch keyboard selection
    this.variantSelects.querySelectorAll('[data-variant-swatch]').forEach(swatch => {
      swatch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          swatch.control.click();
        }
      });
    });
  }

  handleVariantChange() {
    const selectedOptions = Array.from(this.variantInputs)
      .filter(input => input.checked)
      .map(input => input.value);

    const variant = this.productJSON.variants.find(v => {
      return selectedOptions.every((option, index) => {
        return v.options[index] === option;
      });
    });

    if (variant) {
      this.updateVariantState(variant);
    }
  }

  updateVariantState(variant) {
    // Update price
    const priceWrapper = this.container.querySelector('.modern-product__price-wrapper');
    if (priceWrapper && variant) {
      const priceEl = priceWrapper.querySelector('.modern-product__price');
      const compareEl = priceWrapper.querySelector('.modern-product__price-compare');
      const saveBadge = priceWrapper.querySelector('.modern-product__save-badge');
      const soldBadge = priceWrapper.querySelector('.modern-product__sold-badge');

      if (priceEl) {
        priceEl.textContent = this.formatMoney(variant.price);
        priceEl.classList.toggle('modern-product__price--sale', variant.compare_at_price > variant.price);
      }

      if (compareEl) {
        if (variant.compare_at_price > variant.price) {
          compareEl.textContent = this.formatMoney(variant.compare_at_price);
          compareEl.style.display = '';
        } else {
          compareEl.style.display = 'none';
        }
      }

      if (saveBadge) {
        const savings = variant.compare_at_price - variant.price;
        if (savings > 0) {
          saveBadge.textContent = `Save ${this.formatMoney(savings)}`;
          saveBadge.style.display = '';
        } else {
          saveBadge.style.display = 'none';
        }
      }

      if (soldBadge) {
        soldBadge.style.display = variant.available ? 'none' : '';
      }
    }

    // Update add to cart button
    const addToCart = this.container.querySelector('[data-add-to-cart]');
    if (addToCart) {
      const defaultText = addToCart.querySelector('.modern-add-to-cart__default');
      if (defaultText) {
        defaultText.textContent = variant.available
          ? window.theme?.strings?.addToCart || 'Add to cart'
          : window.theme?.strings?.soldOut || 'Sold out';
      }
      addToCart.disabled = !variant.available;
    }

    // Update URL
    const url = new URL(window.location);
    if (variant.id) {
      url.searchParams.set('variant', variant.id);
    } else {
      url.searchParams.delete('variant');
    }
    window.history.replaceState({}, '', url.toString());

    // Update variant input values
    const variantInput = this.container.querySelector('input[name="id"]');
    if (variantInput) variantInput.value = variant.id;

    // Update availability
    this.updateVariantAvailability(variant);

    // Update pickup availability
    const pickup = this.container.querySelector('pickup-availability');
    if (pickup) {
      pickup.fetchAvailability(variant.id);
    }
  }

  updateVariantAvailability(variant) {
    const optionWrappers = this.variantSelects.querySelectorAll('.modern-variant-options');

    optionWrappers.forEach((wrapper, index) => {
      const swatches = wrapper.querySelectorAll('.modern-variant-swatch');
      const selectedValue = variant.options[index];

      swatches.forEach(swatch => {
        const value = swatch.dataset.optionValue;

        // Check if this option is available in any variant
        const isAvailable = this.productJSON.variants.some(v => {
          return v.available &&
            v.options[index] === value &&
            (index === 0 || v.options[0] === (index > 0 ? variant.option1 : value)) &&
            (index === 1 || v.options[1] === (index > 1 ? variant.option2 : value)) &&
            (index === 2 || v.options[2] === value);
        });

        swatch.classList.toggle('is-disabled', !isAvailable);
      });
    });
  }

  // ========== Quantity ==========
  initQuantity() {
    this.quantitySelector = this.container.querySelector('[data-quantity-selector]');
    if (!this.quantitySelector) return;

    this.quantityInput = this.quantitySelector.querySelector('[data-quantity-input]');
    this.minusBtn = this.quantitySelector.querySelector('[data-quantity-minus]');
    this.plusBtn = this.quantitySelector.querySelector('[data-quantity-plus]');

    // Use event delegation on the container for better reliability
    this.quantitySelector.addEventListener('click', (e) => {
      if (e.target.closest('[data-quantity-minus]')) {
        this.updateQuantity(-1);
      } else if (e.target.closest('[data-quantity-plus]')) {
        this.updateQuantity(1);
      }
    });
  }

  updateQuantity(change) {
    let value = parseInt(this.quantityInput.value) || 1;
    const min = parseInt(this.quantityInput.min) || 1;
    const max = parseInt(this.quantityInput.max) || Infinity;

    value = Math.max(min, Math.min(max, value + change));
    this.quantityInput.value = value;

    // Trigger change event for any listeners
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ========== Add to Cart ==========
  initAddToCart() {
    const form = this.container.querySelector('[data-product-form]');
    if (!form) return;

    form.addEventListener('submit', (e) => this.handleAddToCart(e));
  }

  async handleAddToCart(e) {
    e.preventDefault();

    const form = e.target;
    const addToCartBtn = this.container.querySelector('[data-add-to-cart]');
    const defaultText = addToCartBtn?.querySelector('.modern-add-to-cart__default');
    const addedText = addToCartBtn?.querySelector('.modern-add-to-cart__added');
    const errorText = addToCartBtn?.querySelector('.modern-add-to-cart__error');

    if (!addToCartBtn) return;

    // Reset states
    if (defaultText) defaultText.style.display = '';
    if (addedText) addedText.style.display = 'none';
    if (errorText) errorText.style.display = 'none';

    // Show loading
    addToCartBtn.disabled = true;

    try {
      const formData = new FormData(form);
      const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        if (defaultText) defaultText.style.display = 'none';
        if (addedText) addedText.style.display = 'flex';

        // Publish event
        this.publishCartEvent();

        setTimeout(() => {
          if (defaultText) defaultText.style.display = '';
          if (addedText) addedText.style.display = 'none';
        }, 2000);
      } else {
        throw new Error(data.description || 'Error adding to cart');
      }
    } catch (error) {
      if (errorText) {
        errorText.textContent = error.message;
        errorText.style.display = 'block';
      }
    } finally {
      addToCartBtn.disabled = false;
    }
  }

  publishCartEvent() {
    // Trigger cart drawer or cart update
    document.dispatchEvent(new CustomEvent('cart:refresh'));
    document.dispatchEvent(new CustomEvent('ajaxProduct:added'));
  }

  // ========== Pickup Availability ==========
  initPickupAvailability() {
    const pickup = this.container.querySelector('pickup-availability');
    if (!pickup) return;

    // Listen for variant changes
    this.variantSelects?.addEventListener('change', () => {
      const selectedOptions = Array.from(this.variantInputs)
        .filter(input => input.checked)
        .map(input => input.value);

      const variant = this.productJSON.variants.find(v => {
        return selectedOptions.every((option, index) => {
          return v.options[index] === option;
        });
      });

      if (variant) {
        pickup.fetchAvailability(variant.id);
      }
    });
  }

  // ========== Utilities ==========
  formatMoney(cents) {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD'
    });
  }
}

// Initialize on section load
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.modern-product-section');
  sections.forEach(section => {
    if (!section.modernProduct) {
      section.modernProduct = new ModernProductPage(section);
    }
  });
});

// Section Editor reload
if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', (e) => {
    const section = e.target.querySelector('.modern-product-section');
    if (section && !section.modernProduct) {
      section.modernProduct = new ModernProductPage(section);
    }
  });
}

// Product Form Element
if (!customElements.get('product-form')) {
  class ProductForm extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.form = this.querySelector('form');
      this.form?.addEventListener('submit', this.onSubmitHandler.bind(this));
    }

    onSubmitHandler(e) {
      // Handled by ModernProductPage
    }
  }
  customElements.define('product-form', ProductForm);
}
