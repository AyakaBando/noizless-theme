if (typeof boostPFSThemeConfig !== 'undefined') {
  // Override Settings
  var boostPFSFilterConfig = {
    general: {
      limit: boostPFSConfig.custom.products_per_page,
      /* Optional */
      loadProductFirst: true,
    },
  };
}

(function () {
  BoostPFS.inject(this);
  /************************** BUILD PRODUCT LIST **************************/
  // Build Product Grid Item
  ProductGridItem.prototype.compileTemplate = function (data, index) {
    if (!data) data = this.data;
    if (!index) index = this.index;
    var soldOut = !data.available,
      onSale = data.compare_at_price_min > data.price_min,
      priceVaries = data.price_min != data.price_max,
      images = data.images_info;
    if (images.length == 0) {
      images.push({
        src: boostPFSConfig.general.no_image_url,
        id: data.id,
        width: 480,
        height: 480
      });
    }
    // Get First Variant (selected_or_first_available_variant)
    var firstVariant = data['variants'][0];
    if (Utils.getParam('variant') !== null && Utils.getParam('variant') != '') {
      var paramVariant = data.variants.filter(function (e) { return e.id == Utils.getParam('variant'); });
      if (typeof paramVariant[0] !== 'undefined') firstVariant = paramVariant[0];
    } else {
      for (var i = 0; i < data['variants'].length; i++) {
        if (data['variants'][i].available) {
          firstVariant = data['variants'][i];
          break;
        }
      }
    }
    // Get Template
    var itemHtml = boostPFSTemplate.productGridItemHtml;

    //Add class
    itemHtml = itemHtml.replace(/{{mobile_items_per_row}}/g, boostPFSConfig.custom.mobile_items_per_row);
    itemHtml = itemHtml.replace(/{{tablet_items_per_row}}/g, boostPFSConfig.custom.tablet_items_per_row);
    itemHtml = itemHtml.replace(/{{desktop_items_per_row}}/g, boostPFSConfig.custom.desktop_items_per_row);
    itemHtml = itemHtml.replace(/{{horizontal_class}}/g, boostPFSConfig.custom.horizontal_class);
    itemHtml = itemHtml.replace(/{{filter_position_class}}/g, boostPFSConfig.custom.filter_position);


    var has_alternate_image = false;
    if (images.length > 1 &&
      boostPFSConfig.custom.hasOwnProperty('product_show_secondary_image') &&
      boostPFSConfig.custom.product_show_secondary_image == true) {
      has_alternate_image = true;
    }
    itemHtml = itemHtml.replace(/{{has_alternate_image_class}}/g, has_alternate_image ? "ProductItem__ImageWrapper--withAlternateImage" : "");

    var use_natural_size = false;
    if (boostPFSConfig.custom.hasOwnProperty('product_image_size') &&
      boostPFSConfig.custom.product_image_size == 'natural' || boostPFSThemeConfig.custom.use_horizontal) {
      use_natural_size = true;
    }
    itemHtml = itemHtml.replace(/{{use_natural_size_class}}/g, use_natural_size ? "withFallback" : boostPFSConfig.custom.product_image_size);
    var media_aspect_ratio = images[0].width / images[0].height;
    var max_width = images[0].width;
    if (boostPFSThemeConfig.custom.use_horizontal) max_width = 125;
    itemHtml = itemHtml.replace(/{{padding_bottom}}/g, use_natural_size ? 'padding-bottom: ' + (100 / media_aspect_ratio) + '%;' : '');
    itemHtml = itemHtml.replace(/{{media_aspect_ratio}}/g, media_aspect_ratio);
    itemHtml = itemHtml.replace(/{{max_width}}/g, max_width);

    var sizes0 = '200,400,600,700,800,900,1000,1200';
    var image_url = Utils.optimizeImage(images[0]['src'], '{width}x');
    itemHtml = itemHtml.replace(/{{image_url}}/g, image_url);
    itemHtml = itemHtml.replace(/{{supported_sizes}}/g, imageSize(sizes0, images[0]));
    itemHtml = itemHtml.replace(/{{featured_media_id}}/g, images[0].id);
    var featured_media_url = Utils.optimizeImage(images[0]['src'], '600x');
    itemHtml = itemHtml.replace(/{{featured_media_url}}/g, featured_media_url);

    // itemHtml = itemHtml.replace(/{{customMetafield}}/g, displayProductTypeMetafield(data));




    var alternate_image = '';


    if (has_alternate_image && images.length > 1) {
      var sizes1 = '200,300,400,600,800,900,1000,1200';
      var thumbUrl = Utils.optimizeImage(images[1]['src'], '{width}x');
      alternate_image += '<img class="ProductItem__Image ProductItem__Image--alternate Image--lazyLoad Image--fadeIn" data-src="' + thumbUrl + '" data-widths="[' + imageSize(sizes1, images[1]) + ']"  data-sizes="auto" alt="' + data.title + '" data-image-id="' + images[1].id + '">';
    }
    itemHtml = itemHtml.replace(/{{alternate_image}}/g, alternate_image);

    var product_media1_url = featured_media_url;
    if (images.length > 1) {
      product_media1_url = Utils.optimizeImage(images[1]['src'], '600x');
    }
    itemHtml = itemHtml.replace(/{{product_media1_url}}/g, product_media1_url);

    /* Swym integration */
    var itemWishlistHtml = '<button data-with-epi="true" class="swym-button swym-add-to-wishlist-view-product wishlist swym-button product_' + data.id + '" data-swaction="addToWishlist" data-product-id="' + JSON.stringify(data.id) + '" data-variant-id="' + data.variants[0].id + '" data-product-url="' + boostPFSConfig.shop.url + Utils.buildProductItemUrl(data, false) + '"></button>';
    itemHtml = itemHtml.replace(/{{itemWishlist}}/g, itemWishlistHtml);

    // Add Label
    itemHtml = itemHtml.replace(/{{product_labels}}/g, buildLabels(data));

    // Add main attribute (Always put at the end of this function)
    itemHtml = itemHtml.replace(/{{product_info}}/g, buildInfo(data, index));

    var view_product = boostPFSConfig.custom.use_horizontal ? '<a href="{{itemUrl}}" class="ProductItem__ViewButton Button Button--secondary hidden-pocket">' + boostPFSConfig.label.view_product + '</a>' : '';
    itemHtml = itemHtml.replace(/{{view_product}}/g, view_product);

      // Add Reviews
      if (typeof Integration === 'undefined' || !Integration.hascompileTemplate('reviews')) {
        var itemReviews = ''
        if (boostPFSConfig.custom.show_product_rating && !boostPFSConfig.custom.use_horizontal) {
          itemReviews += '<div class="ProductItem__Rating Heading Text--subdued u-h7">';
          var ratingInfo = Utils.getProductMetafield(data, 'reviews', 'rating') || '';
          var ratingValue = '';
          if (ratingInfo != '') {
            ratingInfo = JSON.parse(ratingInfo);
            ratingValue = ratingInfo.value;
            var rating_decimal = 0;
            var decimal = ratingValue % 1;
            if (decimal >= 0.3 && decimal <= 0.7) {
              rating_decimal = 0.5;
            } else if (decimal > 0.7) {
              rating_decimal = 1;
            }

            itemReviews += '<div class="rating">';
            itemReviews += '<div class="rating__stars" role="img" aria-label="';
            itemReviews += boostPFSConfig.label.star_reviews_info.replace(/{{rating_value}}/g, ratingValue).replace(/{{rating_max}}/g, ratingInfo.scale_max);
            itemReviews += '">';

            var rating_as_float = ratingValue * 1.0;
            var i;
            for (i = ratingInfo.scale_min; i <= ratingInfo.scale_max; i++) {
              if (rating_as_float >= i) {
                itemReviews += boostPFSConfig.custom.rating_star_full;
              } else {
                if (rating_decimal == 0.5) {
                  itemReviews += boostPFSConfig.custom.rating_star_half;
                } else if (rating_decimal == 1) {
                  itemReviews += boostPFSConfig.custom.rating_star_full;
                } else {
                  itemReviews += boostPFSConfig.custom.rating_star_empty;
                }
                rating_decimal = false;
              }

            }

            itemReviews += '</div>';
            var rating_count = Utils.getProductMetafield(data, 'reviews', 'rating_count') || '';

            if (rating_count != '') {
              itemReviews += '<span class="rating__caption">' + boostPFSConfig.label.reviews_count.replace(/{{ count }}/g, rating_count) + '</span>';
            } else {
              itemReviews += '<span class="rating__caption">' + boostPFSConfig.label.reviews_count.replace(/{{ count }}/g, 0) + '</span>'
            }

            itemReviews += '</div>';
          } else {
            itemReviews += '<div class="rating">';
            itemReviews += '<div class="rating__stars" role="img" aria-label="';
            itemReviews += boostPFSConfig.label.star_reviews_info.replace(/{{ rating_value }}/g, 0).replace(/{{ rating_max }}/g, 5);
            itemReviews += '">';
            var j;
            for (j = 0; j < 5; j++) {
              itemReviews += boostPFSConfig.custom.rating_star_empty;
            }
            itemReviews += '</div>';
            itemReviews += '<span class="rating__caption">' + boostPFSConfig.label.reviews_count.replace(/{{ count }}/g, 0) + '</span>'
            itemReviews += '</div>';
          }
        }
      itemHtml = itemHtml.replace(/{{itemReviews}}/g, itemReviews);
    }

    // 2023.9.12 Add start render wishlist item
    // お気に入り選択モーダル表示
    let wishlistModalContent = ""
    data?.variants.forEach(variant => {
      wishlistModalContent += `
      <div class="variant_look">
        <div class="color_option_wrapper">
          <img class="variant_option_image" src="${variant.image ? variant.image : data.images[1]}" />
          <div class="option_wrapper">
            ${ variant.options[0] !== "Default Title" ? `<span class="u-h9">${variant.options[0]}</span>`:`<span class="u-h9">${data.title}</span>` }
            ${ variant.options.length > 1 ? `<span class="u-h9">${variant.options[1]}</span>`:"" }
            ${ variant.options.length > 2 ? `<span class="u-h9">${variant.options[2]}</span>`:"" }
            ${ variant.sku ? `<span class="u-h9">${variant.sku}</span>`:"" }
          </div>
        </div>
        <label for="c-wishlist-modal--${variant.id}" class="wish-list-button">
          <button id="c-wishlist-modal--${variant.id}" data-with-epi="true" class="swym-hear-custom-look swym-button swym-add-to-wishlist-view-product product_${data.id}" data-swaction="addToWishlist" data-product-id="${data.id}" data-variant-id="${variant.id}" data-product-url="{{shopUrl}}{{itemUrl}}"></button>
          <span class="u-h10">お気に入りに追加</span>
        </label>
      </div>
      `;
    });
    itemHtml = itemHtml.replace(/{{modalContent}}/g,wishlistModalContent);
    itemHtml = itemHtml.replace(/{{itemId}}/g, data.id);
    itemHtml = itemHtml.replace(/{{shopUrl}}/g, boostPFSConfig.shop.url);
    itemHtml = itemHtml.replace(/{{itemVariantId}}/g,data.variants[0].id);
    // 2023.9.12 Add end render wishlist item

    itemHtml = itemHtml.replace(/{{buildClassHiz}}/g, buildClassHiz());
    itemHtml = itemHtml.replace(/{{buildClass}}/g, buildClass());
    itemHtml = itemHtml.replace(/{{itemUrl}}/g, Utils.buildProductItemUrlWithVariant(data));

    return itemHtml;
  };

  /************************** END BUILD PRODUCT LIST **************************/
  /************************** BUILD PRODUCT ITEM ELEMENTS **************************/
  // function displayProductTypeMetafield(data) {
  //   var html = '';
  //   var metafield = Utils.getProductMetafield(data, 'custom', 'product_type');

  //   console.log(metafield)

  //   if (metafield) {
  //     html += '<span>' + metafield.value + '</span>';
  //   }

  //   return html;
  // }

  
  function buildClass() {
    return boostPFSConfig.custom.filter_position == 'drawer' ? 'lap-and-up' : 'desk';
  }

  function buildClassHiz() {
    return boostPFSConfig.custom.use_horizontal ? 'ProductItem--horizontal' : '';
  }

  function imageSize(sizes, image) {
    if (image) {
      var desired_sizes = sizes.split(',');
      var supported_sizes = '';
      for (var k = 0; k < desired_sizes.length; k++) {
        var size = desired_sizes[k];
        var size_as_int = size * 1;
        if (image.width < size_as_int) { break; }
        supported_sizes = supported_sizes + size + ',';
      }

      if (supported_sizes == '') supported_sizes = image.width;

      if (!jQ.isNumeric(supported_sizes)) {
        supported_sizes = supported_sizes.split(',').join(',');
        supported_sizes = supported_sizes.substring(0, supported_sizes.lastIndexOf(','));
      }
      return supported_sizes;
    } else {
      return '';
    }
  }

  function buildPrice(data) {
    var html = '';
    var show_price_on_hover = boostPFSConfig.custom.product_show_price_on_hover;
    var classPriceHover = show_price_on_hover ? 'ProductItem__PriceList--showOnHover' : '';
    html += '<div class="ProductItem__PriceList ' + classPriceHover + ' Heading">';

    // 2023.9.12 Modify start 
    // 価格表示の制御
    // ①オープン価格表示の場合
    // ②【商品一覧・詳細ページ】価格に値がある場合
    if (Utils.getProductMetafield(data, 'custom', "open_price") && Utils.getProductMetafield(data, 'custom', "open_price") === "true") {
      html += '<span class="ProductItem__Price Price Text--subdued u-h6" data-money-convertible>オープン価格</span>';
    }else if (Utils.getProductMetafield(data, 'custom', "price")) {
      html += '<span class="ProductItem__Price Price Text--subdued u-h6" data-money-convertible>' + Utils.getProductMetafield(data, 'custom', "price") + '</span>';
    }else if (data.compare_at_price_min > data.price_min) {
      if (boostPFSConfig.custom.hasOwnProperty('currency_code_enabled') && boostPFSConfig.custom.currency_code_enabled) {
        html += '<span class="ProductItem__Price Price Price--highlight Text--subdued u-h6">' + Utils.formatMoney(data.price_min, 'money_with_currency') + '</span> ';
        html += '<span class="ProductItem__Price Price Price--compareAt Text--subdued">' + Utils.formatMoney(data.compare_at_price_min, 'money_with_currency') + '</span>';
      } else {
        html += '<span class="ProductItem__Price Price Price--highlight Text--subdued u-h6">' + Utils.formatMoney(data.price_min) + '</span> ';
        html += '<span class="ProductItem__Price Price Price--compareAt Text--subdued">' + Utils.formatMoney(data.compare_at_price_min) + '</span>';
      }

    } else {
      if (data.price_min != data.price_max) {
        if (boostPFSConfig.custom.hasOwnProperty('currency_code_enabled') && boostPFSConfig.custom.currency_code_enabled) {
          html += '<span class="ProductItem__Price Price Text--subdued u-h6">' + boostPFSConfig.label.from_price_html.replace(/{{min_price}}/g, Utils.formatMoney(data.price_min, 'money_with_currency')) + '</span>';
        } else {
          html += '<span class="ProductItem__Price Price Text--subdued u-h6">' + boostPFSConfig.label.from_price_html.replace(/{{min_price}}/g, Utils.formatMoney(data.price_min)) + '</span>';
        }
      } else {
        if (boostPFSConfig.custom.hasOwnProperty('currency_code_enabled') && boostPFSConfig.custom.currency_code_enabled) {
          html += '<span class="ProductItem__Price Price Text--subdued u-h6" data-money-convertible>' + Utils.formatMoney(data.price_min, 'money_with_currency') + '</span>';
        } else {
          html += '<span class="ProductItem__Price Price Text--subdued u-h6" data-money-convertible>' + Utils.formatMoney(data.price_min) + '</span>';
        }
      }
    }
    // 2023.9.12 Modify end 

    html += '</div>';
    return html;
  }

  function buildLabels(data) {
    var html = '';
    var product_labels = '';
    if (boostPFSConfig.custom.show_labels) {
      product_labels = '';
      var tags = data.tags;
      for (var k = 0; k < tags.length; k++) {
        var tag = tags[k];
        if (tag.indexOf('__label') != -1) {
          product_labels += '<span class="ProductItem__Label Heading Text--subdued">' + tag.split('__label:')[1] + '</span>';
          break;
        }
      }
      if (data.available) {
        if (data.compare_at_price_min > data.price_min)
          product_labels += '<span class="ProductItem__Label Heading Text--subdued">' + boostPFSConfig.label.sale + '</span>';
      } else {
        product_labels += ' <span class="ProductItem__Label Heading Text--subdued">' + boostPFSConfig.label.sold_out + '</span>';
      }

      if (product_labels != '') {
        html += '<div class="ProductItem__LabelList">';
        html += product_labels;
        html += '</div>';
      }
    }
    return html;
  }

  function buildInfo(data, indx) {
    var html = '';
    var metafield = "";
    // // 2023.9.12 Add start render metafield
    // // var metafield = Utils.getProductMetafield(data, 'custom', 'product_type');
    // 
    // var metafieldList = [];
    // // コレクション名の引き当て
    // var collections_list = boostPFSConfig.custom.collections_list;
    // var categoryTitle = "";
    // if(Utils.getProductMetafield(data, 'custom', 'category')){
    //   var categoryGID = Utils.getProductMetafield(data, 'custom', 'category').split('/').pop();
    //   var findCollectionTitle = collections_list.find(collection => collection.indexOf(categoryGID) > -1);
    //   if(findCollectionTitle) categoryTitle = findCollectionTitle.split(' , ').pop();
    // }

    // if( Utils.getProductMetafield(data, 'custom', 'size')) {
    //   metafieldList.push(Utils.getProductMetafield(data, 'custom', 'size'));
    // }
    // if( categoryTitle !== "" ) {
    //   // カテゴリー:コレクション(GID)のため、コレクションからタイトルを引き当て
    //   metafieldList.push(categoryTitle);
    // }
    // if( Utils.getProductMetafield(data, 'custom', '_maker_itempage_name')) {
    //   metafieldList.push(Utils.getProductMetafield(data, 'custom', '_maker_itempage_name'));
    // }
    // if( Utils.getProductMetafield(data, 'custom', 'product_type')) {
    //   metafieldList.push(Utils.getProductMetafield(data, 'custom', 'product_type'));
    // }
    // if(metafieldList.length > 0) {
    //   metafield = metafieldList.join(" | ")
    // }
    // // 2023.9.12 Add end render metafield

    if (boostPFSConfig.custom.show_product_info) {
      var infoClass = (!boostPFSConfig.custom.use_horizontal) ? 'ProductItem__Info--' + boostPFSConfig.custom.product_info_alignment : '';
      html += '<div class="ProductItem__Info ' + infoClass + ' ">';
      html += '<div class="venderLabel_wrapper">';
      if (boostPFSConfig.custom.show_vendor) {
        html += '<div class="ProductItem__Vendor u-h8">' + data.vendor + '</div>'
      }
      
      html += `<div class="ProductPage_label">`;
      var tags = data.tags;
      for (var i = 0; i < tags.length; i++) {
        if ( tags[i] === 'label__面' ) {
          html += `<div class="ProductPage_labelItem men">${tags[i].replace("label__","")}</div>`;
        }
        if ( tags[i] === 'label__線' ) {
          html += `<div class="ProductPage_labelItem sen">${tags[i].replace("label__","")}</div>`;
        }
        if ( tags[i] === 'label__点' ) {
          html += `<div class="ProductPage_labelItem ten">${tags[i].replace("label__","")}</div>`;
        }
      }
      html += `</div>`;
      html += `</div>`;

      html += '<h2 class="ProductItem__Title u-h6">';
      html += '<a href="{{itemUrl}}">' + data.title + '</a>';
      html += '</h2>';

      if (metafield){
      html += '<span>' + metafield + '</span>';
      }

        
      html += '{{itemReviews}}';
      html += buildPrice(data);
      if (boostPFSConfig.custom.show_color_swatch) {
        html += buildSwatch(data, indx);
      }
      html += '</div>';
    }

    return html;
  }

  function buildSwatch(data, indx) {
    var itemSwatchHtml = '';
    if (boostPFSConfig.custom.show_color_swatch) {
      var color_name = boostPFSConfig.custom.section_id + '-' + data.id + '-' + indx;
      data.options_with_values.forEach(function (option, index) {
        var option_name = option.name.toLowerCase();
        if (option_name.indexOf('color') != -1 || option_name.indexOf('colour') != -1 || option_name.indexOf('couleur') != -1) {
          var values = '';
          itemSwatchHtml += '<div class="ProductItem__ColorSwatchList">';
          var i = 0;
          data.variants.forEach(function (variant) {
            var temp = variant.merged_options.filter(function (obj) {
              obj = obj.toLowerCase();
              if (obj.indexOf('color') != -1 || obj.indexOf('colour') != -1 || obj.indexOf('couleur') != -1)
                return obj;
            });
            temp = temp[0].split(':');

            var value = temp[1].toLowerCase();
            if (values.indexOf(value) == -1) {
              values = values + ',' + value;
              values = values.split(',');
              var size = '200,400,600,700,800,900,1000,1200';
              var supported_sizes = imageSize(size, variant.image);
              var color_image = Utils.optimizeImage(variant.image);
              var name_color = Utils.slugify(value) + '.png';
              var checked = (i == 0) ? 'checked=checked' : '';
              var imageInfo = null;
              var image_aspect_ratio = 1;
              imageInfo = data.images_info.find(function (imageOb) {
                if (imageOb.src == variant.image) {
                  image_aspect_ratio = imageOb.width / imageOb.height;
                  return imageOb;
                }
              });
              if (!imageInfo) {
                if (data.images_info.length > 0) {
                  imageInfo = data.images_info[0];
                } else {
                  imageInfo = {
                    src: boostPFSConfig.general.no_image_url,
                    id: variant.id,
                    width: 480,
                    height: 480
                  }
                }

              }
              var dataImg = (imageInfo != null) ? '" data-image-url="' + imageInfo.src + '" data-image-widths="[' + supported_sizes + ']" data-image-aspect-ratio="1" data-image-id="' + imageInfo.id + '"' : '';
              var color_input_id = color_name + "-" + values.length;
              var variant_price = variant.price ? variant.price : 0;
              var variant_compare_at_price = variant.compare_at_price ? variant.compare_at_price : 0;
              var url_color = Utils.getFilePath(Utils.slugify(value), Globals.swatchExtension, Settings.getSettingValue('general.swatchImageVersion'));
              itemSwatchHtml += '<div class="ProductItem__ColorSwatchItem">';
              itemSwatchHtml += '<input class="ColorSwatch__Radio" type="radio" ' + checked + ' name="' + color_name + '" id="' + color_input_id + '" value="' + value + '" data-image-aspect-ratio="' + image_aspect_ratio + '" data-variant-price="' + variant_price + '" data-variant-compare-at-price="' + variant_compare_at_price + '" data-variant-url="' + Utils.buildProductItemUrl(data) + '?variant=' + variant.id + '#Image' + imageInfo.id + '"' + dataImg + '  aria-hidden="true">';
              itemSwatchHtml += '<label class="ColorSwatch ColorSwatch--small" for="' + color_input_id + '" style="background-color: ' + value.replace(' ', '').toLowerCase() + '; background-image: url(' + url_color + ')" title="' + value + '" data-tooltip="' + value + '"></label>';
              itemSwatchHtml += '</div>';
              i++;
            }
          });
          itemSwatchHtml += '</div>';
        }
      });
    }
    return itemSwatchHtml;
  }
  /************************** END BUILD PRODUCT ITEM ELEMENTS **************************/
  /************************** BUILD TOOLBAR **************************/
  // Build Pagination
  ProductPaginationDefault.prototype.compileTemplate = function (totalProduct) {
    if (!totalProduct) totalProduct = this.totalProduct
    // Get page info
    var currentPage = parseInt(Globals.queryParams.page);
    var totalPage = Math.ceil(totalProduct / Globals.queryParams.limit);

    if (totalPage > 1) {
      var paginationHtml = boostPFSTemplate.paginateHtml;
      // Build Previous
      var previousHtml = (currentPage > 1) ? boostPFSTemplate.previousActiveHtml : boostPFSTemplate.previousDisabledHtml;
      previousHtml = previousHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage - 1));
      paginationHtml = paginationHtml.replace(/{{previous}}/g, previousHtml);
      // Build Next
      var nextHtml = (currentPage < totalPage) ? boostPFSTemplate.nextActiveHtml : boostPFSTemplate.nextDisabledHtml;
      nextHtml = nextHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage + 1));
      paginationHtml = paginationHtml.replace(/{{next}}/g, nextHtml);
      // Create page items array
      var beforeCurrentPageArr = [];
      for (var iBefore = currentPage - 1; iBefore > currentPage - 3 && iBefore > 0; iBefore--) {
        beforeCurrentPageArr.unshift(iBefore);
      }
      if (currentPage - 4 > 0) {
        beforeCurrentPageArr.unshift('...');
      }
      if (currentPage - 4 >= 0) {
        beforeCurrentPageArr.unshift(1);
      }
      beforeCurrentPageArr.push(currentPage);
      var afterCurrentPageArr = [];
      for (var iAfter = currentPage + 1; iAfter < currentPage + 3 && iAfter <= totalPage; iAfter++) {
        afterCurrentPageArr.push(iAfter);
      }
      if (currentPage + 3 < totalPage) {
        afterCurrentPageArr.push('...');
      }
      if (currentPage + 3 <= totalPage) {
        afterCurrentPageArr.push(totalPage);
      }
      // Build page items
      var pageItemsHtml = '';
      var pageArr = beforeCurrentPageArr.concat(afterCurrentPageArr);
      for (var iPage = 0; iPage < pageArr.length; iPage++) {
        if (pageArr[iPage] == '...') {
          pageItemsHtml += boostPFSTemplate.pageItemRemainHtml;
        } else {
          pageItemsHtml += (pageArr[iPage] == currentPage) ? boostPFSTemplate.pageItemSelectedHtml : boostPFSTemplate.pageItemHtml;
        }
        pageItemsHtml = pageItemsHtml.replace(/{{itemTitle}}/g, pageArr[iPage]);
        pageItemsHtml = pageItemsHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, pageArr[iPage]));
      }
      paginationHtml = paginationHtml.replace(/{{pageItems}}/g, pageItemsHtml);
      return paginationHtml;
    }

    return '';
  };

  // Build Sorting
  ProductSorting.prototype.compileTemplate = function () {
    var html = '';
    if (boostPFSConfig.custom.show_sorting && boostPFSTemplate.hasOwnProperty('sortingHtml')) {
      var sortingArr = Utils.getSortingList();
      if (sortingArr) {
        // Build content
        var sortingItemsHtml = '';
        for (var k in sortingArr) {
          var classActive = (Globals.queryParams.sort == k) ? 'is-selected' : '';
          sortingItemsHtml += '<button class="Popover__Value ' + classActive + ' Heading Link Link--primary u-h6" data-value="' + k + '">' + sortingArr[k] + '</button>';
        }
        html = boostPFSTemplate.sortingHtml.replace(/{{sortingItems}}/g, sortingItemsHtml);
      }
    }
    return html;
  };

  // Build Sorting event
  ProductSorting.prototype.bindEvents = function () {
    var topSortingSelector = jQ(Selector.topSorting);
    topSortingSelector.find('.Popover__Value').click(function (e) {
      FilterApi.setParam('sort', jQ(this).data('value'));
      FilterApi.setParam('page', 1);
      FilterApi.applyFilter('sort');
      jQ('.CollectionToolbar__Item--sort').trigger('click');
    });
  }
  /************************** END BUILD TOOLBAR **************************/

  // Add additional feature for product list, used commonly in customizing product list
  ProductList.prototype.afterRender = function (data, eventType) {
    if (!data) data = this.data;
    if (!eventType) eventType = this.eventType;
    /**
     *  Call theme function
     *  1. Add var bcPrestigeSections; var bcPrestigeSectionContainer; to assets/theme.min.js
     *  2. In assets/theme.min.js, find var YYY=new XXX.SectionContainer; For example: var e=new o.SectionContainer;
     *  3. Replace var e=new o.SectionContainer; by var e=new o.SectionContainer; var YYY = new XXX.SectionContainer;  bcPrestigeSections = YYY; bcPrestigeSectionContainer = XXX;

    if(typeof bcPrestigeSectionContainer != 'undefined' && typeof bcPrestigeSections != 'undefined'){
    bcPrestigeSections.register("collection", bcPrestigeSectionContainer.CollectionSection);
    bcPrestigeSections.register("search", bcPrestigeSectionContainer.SearchSection);
    }
    */

    // Fix image not load on Instagram browser - initialize swatch image
    jQ(".ProductItem__Info .ProductItem__ColorSwatchList .ProductItem__ColorSwatchItem label.ColorSwatch").click(function () {
      jQ(this).parent().parent().find('label.ColorSwatch').removeClass('active');
      jQ(this).addClass('active');
      var parent = jQ(this).parent();
      var productImage = jQ(this).parent().parent().parent().parent().find('a.ProductItem__ImageWrapper');
      var variantInfo = parent.find('input.ColorSwatch__Radio');
      productImage.find('.AspectRatio .bc-sf-product-swatch-img').remove();
      productImage.find('.AspectRatio').prepend('<img class="bc-sf-product-swatch-img" src="' + variantInfo.data('image-url') + '" />');
      productImage.find('img.ProductItem__Image').hide();
      productImage.attr('href', variantInfo.data('variant-url'));
      var variantPrice = '';
      if (variantInfo.data('variant-compare-at-price') > variantInfo.data('variant-price')) {
        variantPrice += '<span class="ProductItem__Price Price Price--highlight Text--subdued u-h6" data-money-convertible="">' + Utils.formatMoney(variantInfo.data('variant-price')) + '</span>'
        variantPrice += '<span class="ProductItem__Price Price Price--compareAt Text--subdued u-h6" data-money-convertible="">' + Utils.formatMoney(variantInfo.data('variant-compare-at-price')) + '</span>';
      } else {
        variantPrice += '<span class="ProductItem__Price Price Text--subdued u-h6" data-money-convertible>' + Utils.formatMoney(variantInfo.data('variant-price')) + '</span>';
      }
      jQ(this).closest('.ProductItem__Wrapper').find('.ProductItem__PriceList').html(variantPrice);
    })

    //Change view layout
    var desktopView = jQ('.CollectionToolbar__LayoutSwitch.hidden-phone').find('.is-active').data('count');
    if (desktopView && desktopView != parseInt(boostPFSConfig.custom.desktop_row)) {
      jQ(Selector.products + ' .Grid__Cell').removeClass('1/' + boostPFSConfig.custom.tablet_row + '--tablet-and-up 1/' + boostPFSConfig.custom.desktop_row + '--' + buildClass());
      jQ(Selector.products + ' .Grid__Cell').addClass('1/' + desktopView + '--tablet-and-up 1/' + desktopView + '--' + buildClass());
    }
    var mobileView = jQ('.CollectionToolbar__LayoutSwitch.hidden-tablet-and-up').find('.is-active').data('count');
    if (mobileView && mobileView != parseInt(boostPFSConfig.custom.mobile_row)) {
      jQ(Selector.products + ' .Grid__Cell').removeClass('1/' + boostPFSConfig.custom.mobile_row + '--phone');
      jQ(Selector.products + ' .Grid__Cell').addClass('1/' + mobileView + '--phone');
    }
  };

  // Build additional elements
  Filter.prototype.afterRender = function (data, eventType) {
    if (!data) data = this.data;
    /** End Swym integration **/
    document.dispatchEvent(new CustomEvent("swym:collections-loaded"));
    if (!eventType) eventType = this.eventType;
  };

  // Build Default layout
  Filter.prototype.errorFilterCallback = function () { var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, isSafari = /Safari/.test(navigator.userAgent), isBackButton = window.performance && window.performance.navigation && 2 == window.performance.navigation.type; if (!(isiOS && isSafari && isBackButton)) { var self = this, url = window.location.href.split("?")[0], searchQuery = self.isSearchPage() && self.queryParams.hasOwnProperty("q") ? "&q=" + self.queryParams.q : ""; window.location.replace(url + "?view=bc-original" + searchQuery) } };
})();