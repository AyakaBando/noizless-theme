// Array to store product meta information
let itemMetaInfoList = [];

// Function to watch for product item view
function watchProductItemView() {
  const observer = new MutationObserver(() => {
    document
      .querySelectorAll(".wishlist-item .title")
      .forEach((productTitle) => {
        let productMetaInfo = itemMetaInfoList.find(
          (info) => info.title === productTitle.textContent
        );
        console.log("Product Meta Info:", productMetaInfo);

        if (
          productMetaInfo &&
          productTitle
            .closest(".wishlist-item")
            .querySelectorAll(".c-metafield-info--on-grid").length === 0
        ) {
          let metafieldList = [];

          if (productMetaInfo.priceInfo) {
            metafieldList.push(
              `<span class="c-metafield-info__content">${productMetaInfo.priceInfo}</span>`
            );
          }

          if (productMetaInfo.manufacturerName) {
            metafieldList.push(
              `<span class="c-metafield-info__title">メーカー</span><span class="c-metafield-info__content">${productMetaInfo.manufacturerName}</span>`
            );
          }

          if (productMetaInfo.sku) {
            let SKU = JSON.parse(productMetaInfo.sku)[
              productTitle.textContent.trim()
            ];
            if (SKU && SKU !== "") {
              metafieldList.push(
                `<span class="c-metafield-info__title">品番</span><span class="c-metafield-info__content">${SKU}</span>`
              );
            }
          }

          if (productMetaInfo.size) {
            let SIZE = JSON.parse(productMetaInfo.size)[
              productTitle.textContent.trim()
            ];
            if (SIZE && SIZE !== "") {
              metafieldList.push(
                `<span class="c-metafield-info__title">サイズ</span><span class="c-metafield-info__content">${SIZE}</span>`
              );
            }
          }

          if (productMetaInfo.type) {
            let variantTitleElem = productTitle
              .closest(".wishlist-item")
              .querySelector(".variant-title");
            if (
              !variantTitleElem.querySelector(
                ".c-metafield-info__title--product-type"
              )
            ) {
              variantTitleElem.insertAdjacentHTML(
                "afterbegin",
                `<span class="c-metafield-info__title c-metafield-info__title--product-type">${productMetaInfo.type}</span>`
              );
            }
          }

          let metafield = metafieldList.join("");
          let gridPrice = productTitle
            .closest(".wishlist-item")
            .querySelector(".product-price");
          gridPrice.insertAdjacentHTML(
            "afterend",
            `<span class="c-metafield-info--on-grid">${metafield}</span>`
          );

          localStorage.setItem(
            productMetaInfo.title,
            JSON.stringify(productMetaInfo)
          );
        }
      });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Function to fetch product information
function fetchProduct(productItem) {
  return new Promise((resolve) => {
    console.log("Fetching product:", productItem.title);
    setTimeout(() => {
      itemMetaInfoList.push(productItem);
      resolve();
    }, 1000);
  });
}

// Function to fetch product information for multiple products
async function getProductInfo(products) {
  console.log("Fetching product information for:", products);
  try {
    await Promise.all(products.map((product) => fetchProduct(product)));
    console.log("Product info fetched successfully");
  } catch (error) {
    console.error("Error fetching product info:", error);
  }
}

// Function to check if product meta information in localStorage is complete
function isProductMetaInfoComplete(productMetaInfo) {
  return (
    productMetaInfo.productId &&
    productMetaInfo.variantId &&
    productMetaInfo.title &&
    productMetaInfo.price &&
    productMetaInfo.sku &&
    productMetaInfo.name
  );
}


// Function to initialize wishlist buttons with complete product meta information
const initWishlistButtons = () => {
  const wishlistButtons = document.querySelectorAll(".wishlist-button");

  wishlistButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const productMetaInfo = {
        productId: button.dataset.productId,
        variantId: button.dataset.variantId,
        title: button.dataset.variantTitle,
        price: button.dataset.variantPrice,
        sku: button.dataset.variantSku,
        name: button.dataset.productName,
        image: button.dataset.variantImage,
        size: button.dataset.productSize,
        category: button.dataset.productCategory,
        manufacturerURL: button.dataset.productManufacturerUrl,
        manufacturerName: button.dataset.productManufacturerName,
        contactNumber: button.dataset.productContactNumber,
        details: button.dataset.productDetails,
        type: button.dataset.productType,
        priceInfo: button.dataset.productPriceInfo,
        commonName: button.dataset.variantCustomCommonName,
        companyName: button.dataset.productCompanyName,
        variantSize: button.dataset.variantSize
      };

      console.log(productMetaInfo);

      const wishlistItems = JSON.parse(localStorage.getItem("wishlist")) || [];
      const variantInWishlist = wishlistItems.find(
        (item) => item.variantId === productMetaInfo.variantId
      );

      if (!variantInWishlist) {
        if (isProductMetaInfoComplete(productMetaInfo)) {
          wishlistItems.push(productMetaInfo);
          localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
          console.log(productMetaInfo.title, "is added to wishlist");
          button.classList.add("wishlist-added");
        } else {
          fetchProduct(productMetaInfo)
            .then(() => {
              wishlistItems.push(productMetaInfo);
              localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
              console.log(productMetaInfo.title, "is added to wishlist");
              button.classList.add("wishlist-added");
            })
            .catch((error) => {
              console.error("Error fetching complete product info:", error);
            });
        }
      } else {
        console.error(productMetaInfo.title, "is already in wishlist");
      }
    });
  });
};

document.addEventListener("DOMContentLoaded", function () {
  watchProductItemView();
  initWishlistButtons();
});
