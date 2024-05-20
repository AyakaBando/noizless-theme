/**
 * Include your custom JavaScript here.
 *
 * We also offer some hooks so you can plug your own logic. For instance, if you want to be notified when the variant
 * changes on product page, you can attach a listener to the document:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   var variant = event.detail.variant; // Gives you access to the whole variant details
 * });
 *
 * You can also add a listener whenever a product is added to the cart:
 *
 * document.addEventListener('product:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 *   var quantity = event.detail.quantity; // Get the quantity that was added
 * });
 *
 * If you just want to force refresh the mini-cart without adding a specific product, you can trigger the event
 * "cart:refresh" in a similar way (in that case, passing the quantity is not necessary):
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 */


// 2023.9.12 Add start
const openWishlistModal = (_targetModal,_targetModalClose) => {
  const modal = document.getElementById(_targetModal);
  const buttonClose = document.getElementById(_targetModalClose);
  modal.style.display = 'block';

  // バツ印がクリックされた時
  buttonClose.addEventListener('click', modalClose);
  function modalClose() {
    modal.style.display = 'none';
  }

  // モーダルコンテンツ以外がクリックされた時
  addEventListener('click', outsideClose);
  function outsideClose(e) {
    if (e.target == modal) {
      modal.style.display = 'none';
    }
  }
}
// 2023.9.12 Add end

// Wishlist
// document.addEventListener('DOMContentLoaded', function() {
//   let wishlistButtons = document.querySelectorAll('.add-to-wishlist');
//   wishlistButtons.forEach(function(button) {
//     button.addEventListener('click', function(event) {
//       const productId = button.getAttribute('data-product-id');
//       const variantId = button.getAttribute('data-variant-id');
//       const variantTitle = button.getAttribute('data-variant-title');
//       const variantPrice = button.getAttribute('data-variant-price');
//       const variantSKU = button.getAttribute('data-variant-sku');
//       const productName = button.getAttribute('data-product-name');
//       const productSize = button.getAttribute('data-product-size');
//       const productCategory = button.getAttribute('data-product-category');
//       const manufacturerURL = button.getAttribute('data-product-manufacturer-url');
//       const manufacturerName = button.getAttribute('data-product-manufacturer-name');
//       const contactNumber = button.getAttribute('data-product-contact-number');
//       const details = button.getAttribute('data-product-details');
//       const type = button.getAttribute('data-product-type');
//       const openPrice = button.getAttribute('data-product-open-price');
//       const priceInfo = button.getAttribute('data-product-price-info');

//       // Construct an object with product meta information
//       const productMetaInfo = {
//         productId: productId,
//         variantId: variantId,
//         title: variantTitle,
//         price: variantPrice,
//         sku: variantSKU,
//         name: productName,
//         size: productSize,
//         category: productCategory,
//         manufacturerURL: manufacturerURL,
//         manufacturerName: manufacturerName,
//         contactNumber: contactNumber,
//         details: details,
//         type: type,
//         openPrice: openPrice,
//         priceInfo: priceInfo
//       };

//       const wishlistItems = JSON.parse(localStorage.getItem('wishlist')) || [];

//       // Check if the variant is already in the wishlist
//       const variantInWishlist = wishlistItems.find(item => item.variantId === variantId);

//       if (!variantInWishlist) {
//         wishlistItems.push(productMetaInfo);
//         localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
//         console.log(variantTitle, ' added to wishlist!');
//       } else {
//         console.error(variantTitle, ' already in wishlist!');
//       }
//     })
//   })
// })

