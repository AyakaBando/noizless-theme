/*
	・itemMetaInfoList
	 itemMetaInfoList[0]:商品名
	 itemMetaInfoList[1]:サイズ JSON.parse(productMetaInfo[1])
	 itemMetaInfoList[2]:カテゴリー
	 itemMetaInfoList[3]:メーカー商品ページのURL
	 itemMetaInfoList[4]:メーカー商品ページの名称
	 itemMetaInfoList[5]:お問合せ電話番号
	 itemMetaInfoList[6]:商品詳細
	 itemMetaInfoList[7]:商品タイプ
	 itemMetaInfoList[8]:商品SKU JSON.parse(productMetaInfo[8])
	 itemMetaInfoList[9]:オープン価格表示かどうか
	 itemMetaInfoList[10]:価格補足情報 JSON.parse(productMetaInfo[10])
	 itemMetaInfoList[11]:一般名称
*/
let itemMetaInfoList = [];

function filterObjectKeys(obj, searchTextList) {
  let filteredValue = "";

  for (const key in obj) {
		if(typeof searchTextList[2] !== 'undefined'){
			if (key.includes(searchTextList[0])  && key.includes(searchTextList[1]) && key.includes(searchTextList[2])) {
				filteredValue= obj[key];
			}
		}else if(typeof searchTextList[1] !== 'undefined'){
			if (key.includes(searchTextList[0])  && key.includes(searchTextList[1])) {
				filteredValue= obj[key];
			}
		}else if (key.includes(searchTextList[0])
		) {
      filteredValue= obj[key];
    }
  }
  
  return filteredValue;
}

function watchProductItemView() {
	setInterval(()=>{
		// 商品一覧の表示
		document.querySelectorAll('.swym-wishlist-item .swym-title').forEach(productTitle => {
			let productMetaInfo = itemMetaInfoList.find(info => info[0].indexOf(productTitle.textContent) > -1);
			if(productMetaInfo.length > 0 && productTitle.closest('.swym-wishlist-item').querySelectorAll('.c-metafield-info--on-grid').length === 0) {
				let metafield = "";
				let metafieldList = [];

				// 価格表示の制御
				// ①オープン価格表示の場合
				// ②価格補足情報に値がある場合
				if(productMetaInfo[9] === "true"){
					let gridPrice = productTitle.closest('.swym-wishlist-item').querySelector('.swym-product-price .swym-product-final-price');
					gridPrice.textContent="オープン価格"
				}else if (productMetaInfo[10]){
					let variantList = JSON.parse(productMetaInfo[10]);
					let PRICE = "";
					if(Object.keys( (variantList) ).length <= 1){
						PRICE = variantList[Object.keys( (variantList) )[0]];
					}else{
						let variantTItlte = productTitle.closest('.swym-wishlist-item').querySelector('.swym-variant-title').textContent;
						PRICE = variantList[variantTItlte];
					}
					if(PRICE && PRICE !== ""){
						let gridPrice = productTitle.closest('.swym-wishlist-item').querySelector('.swym-product-final-price');
						if(!gridPrice.querySelector('.c-metafield-info__variant-price')){
							gridPrice.insertAdjacentHTML('beforeend', `
								<span class="c-metafield-info__variant-price">${PRICE}</span>
							`);
						}
					}
				}

				// 一般名称
				if( productMetaInfo[11]) {
					metafieldList.push(`
						<span class="c-metafield-info__content">${productMetaInfo[11]}</span>
					`);
				}

				// メーカー
				if( productMetaInfo[4]) {
					metafieldList.push(`
						<span class="c-metafield-info__title">メーカー</span><span class="c-metafield-info__content">${productMetaInfo[4]}</span>
					`);
				}
				// 品番(SKU)
				if( productMetaInfo[8]) {
					let variantList = JSON.parse(productMetaInfo[8]);
					let SKU = "";
					if(Object.keys( (variantList) ).length <= 1){
						SKU = variantList[Object.keys( (variantList) )[0]];
					}else{
						let variantTItlte = productTitle.closest('.swym-wishlist-item').querySelector('.swym-variant-title').textContent;
						SKU = variantList[variantTItlte];
					}
					if(SKU && SKU !== ""){
						metafieldList.push(`
							<span class="c-metafield-info__title">品番</span><span class="c-metafield-info__content">${SKU}</span>
						`);
					}
				}
				// サイズ
				if( productMetaInfo[1]) {
					let variantList = JSON.parse(productMetaInfo[1]);
					let SIZE = "";
					if(Object.keys( (variantList) ).length <= 1){
						SIZE = variantList[Object.keys( (variantList) )[0]];
					}else{
						let variantTItlte = productTitle.closest('.swym-wishlist-item').querySelector('.swym-variant-title').textContent;
						SIZE = variantList[variantTItlte];
					}
					if(SIZE && SIZE !== ""){
						metafieldList.push(`
							<span class="c-metafield-info__title">サイズ</span><span class="c-metafield-info__content">${SIZE}</span>
						`);
					}
				}

				// 商品タイプ(Variant title箇所に表示)
				if( productMetaInfo[7]) {
					let variantTItlteElem = productTitle.closest('.swym-wishlist-item').querySelector('.swym-variant-title');
					if(!variantTItlteElem.querySelector('.c-metafield-info__title--product-type')){
						variantTItlteElem.insertAdjacentHTML('afterbegin', `
							<span class="c-metafield-info__title c-metafield-info__title--product-type">${productMetaInfo[7]}</span>
					`);
					}
				}

				if(metafieldList.length > 0) {
					metafield = metafieldList.join("");
					let gridPrice = productTitle.closest('.swym-wishlist-item').querySelector('.swym-product-price');
					gridPrice.insertAdjacentHTML('afterend', `
						<span class="c-metafield-info--on-grid">${metafield}</span>
					`);
				}
			}
		});

		// 商品詳細の表示
		document.querySelectorAll('.swym-wishlist-detail .swym-wishlist-product-title').forEach(productTitle => {
			let productMetaInfo = itemMetaInfoList.find(info => info[0].indexOf(productTitle.textContent) > -1)
			if(productMetaInfo.length > 0 && productTitle.parentNode.querySelectorAll('.c-metafield-info').length === 0) {

				// 価格表示の制御
				// ①オープン価格表示の場合
				// ②価格補足情報に値がある場合
				if(productMetaInfo[9] === "true"){
					let gridPrice = productTitle.parentNode.querySelector('.swym-product-final-price');
					gridPrice.textContent="オープン価格"
				}else if (productMetaInfo[10]){
					let variantList = JSON.parse(productMetaInfo[10]);
					let PRICE = "";
					if(Object.keys( (variantList) ).length <= 1){
						PRICE = variantList[Object.keys( (variantList) )[0]];
					}else{
						let variantSelector = productTitle.parentNode.querySelector('.swym-wishlist-variant-select .swym-value');
						PRICE = variantList[variantSelector];


						let variantSelectorList = productTitle.parentNode.querySelectorAll('.swym-wishlist-variant-select .swym-value');
						let optionList = [];
						variantSelectorList.forEach(variantSelector => {
							optionList.push(variantSelector.value)
						})
						PRICE = filterObjectKeys(variantList,optionList);
						variantSelectorList.forEach(variantSelector => {
							variantSelector.addEventListener('change',(event) => {
								variantSelectorList = productTitle.parentNode.querySelectorAll('.swym-wishlist-variant-select .swym-value');
								optionList = [];
								variantSelectorList.forEach(variantSelector => {
									optionList.push(variantSelector.value)
								})
								let setPRICE = filterObjectKeys(variantList,optionList);
								if(setPRICE) {
									let gridPrice = productTitle.parentNode.querySelector('.swym-product-final-price');
									if(!gridPrice.querySelector('.c-metafield-info__variant-price')){
										gridPrice.insertAdjacentHTML('beforeend', `
											<span class="c-metafield-info__variant-price">${setPRICE}</span>
										`);
									}
								}
							})
						});
					}
					if(PRICE && PRICE !== ""){
						let gridPrice = productTitle.parentNode.querySelector('.swym-product-final-price');
						if(!gridPrice.querySelector('.c-metafield-info__variant-price')){
							gridPrice.insertAdjacentHTML('beforeend', `
								<span class="c-metafield-info__variant-price">${PRICE}</span>
							`);
						}
					}
				}

				// SKUの取得
				let SKU = "";
				if( productMetaInfo[8]) {
					let variantList = JSON.parse(productMetaInfo[8]);
					if(Object.keys( (variantList) ).length <= 1){
						SKU = variantList[Object.keys( (variantList) )[0]];
					}else{
						let variantSelectorList = productTitle.parentNode.querySelectorAll('.swym-wishlist-variant-select .swym-value');
						let optionList = [];
						variantSelectorList.forEach(variantSelector => {
							optionList.push(variantSelector.value)
						})
						SKU = filterObjectKeys(variantList,optionList);
						variantSelectorList.forEach(variantSelector => {
							variantSelector.addEventListener('change',(event) => {
								variantSelectorList = productTitle.parentNode.querySelectorAll('.swym-wishlist-variant-select .swym-value');
								optionList = [];
								variantSelectorList.forEach(variantSelector => {
									optionList.push(variantSelector.value)
								})
								let setSKU = filterObjectKeys(variantList,optionList);
								if(setSKU) productTitle.parentNode.querySelector('.c-metafield-info__variant-sku').textContent = setSKU;
							})
						});
					}
				}

				// サイズの取得
				let SIZE = "";
				if( productMetaInfo[1]) {
					let variantList = JSON.parse(productMetaInfo[1]);
					if(Object.keys( (variantList) ).length <= 1){
						SIZE = variantList[Object.keys( (variantList) )[0]];
					}else{
						let variantSelectorList = productTitle.parentNode.querySelectorAll('.swym-wishlist-variant-select .swym-value');
						let optionList = [];
						variantSelectorList.forEach(variantSelector => {
							optionList.push(variantSelector.value)
						})
						SIZE = filterObjectKeys(variantList,optionList);
						variantSelectorList.forEach(variantSelector => {
							variantSelector.addEventListener('change',(event) => {
								variantSelectorList = productTitle.parentNode.querySelectorAll('.swym-wishlist-variant-select .swym-value');
								optionList = [];
								variantSelectorList.forEach(variantSelector => {
									optionList.push(variantSelector.value)
								})
								let setSIZE = filterObjectKeys(variantList,optionList);
								if(setSIZE) productTitle.parentNode.querySelector('.c-metafield-info__variant-size').textContent = setSIZE;
							})
						});
					}
				}
				

				let productPrice = productTitle.parentNode.querySelector('.swym-product-price');
				productPrice.insertAdjacentHTML('afterend', `
				<div class="c-metafield-info">
					${ productMetaInfo[11] ? `<div class="c-metafield-info__item swym-text swym-text-1"><span>一般名称</span><span>${productMetaInfo[11]}</span></div>` : ""}
					${ productMetaInfo[4] ? `<div class="c-metafield-info__item swym-text swym-text-1"><span>メーカー</span><a href="${productMetaInfo[3]}">${productMetaInfo[4]}</a></div>` : ""}
					${ SKU ? `<div class="c-metafield-info__item swym-text swym-text-1"><span>品番</span><span class="c-metafield-info__variant-sku">${SKU}</span></div>` : ""}
					${ SIZE ? `<div class="c-metafield-info__item swym-text swym-text-1"><span>サイズ</span><span class="c-metafield-info__variant-size">${SIZE}</span></div>` : ""}
				</div>
				`);
			}
		});
	}, 500);
}

// エスケープ文字を元に戻す
function unescapeHtml(str) {
	if (typeof str !== 'string') return str;

	var patterns = {
		'&lt;'   : '<',
		'&gt;'   : '>',
		'&amp;'  : '&',
		'&quot;' : '"',
		'&#x27;' : '\'',
		'&#x60;' : '`'
	};

	return str.replace(/&(lt|gt|amp|quot|#x27|#x60);/g, function(match) {
		return patterns[match];
	});
};

function fetchProduct(productItem) {
	return new Promise(resolve => {
		fetch("".concat(`${productItem.du}`, "?view=get-metafield"), {
				credentials: 'same-origin',
				method: 'GET'
			})
			.then((response) => {
				response.text().then(function (content) {
					const contentElem = document.createElement('div');
					contentElem.innerHTML = content;
					let metaData = unescapeHtml(contentElem.querySelector('.shopify-section').innerHTML);
					itemMetaInfoList.push(metaData.split("++"));
					resolve(response);
				});
			})
			.catch((error) => {
				resolve(productItem);
			});
	})
}

async function getProductInfo(products) {
	const fetchProducts = products.map(product => fetchProduct(product));

	await Promise.all(fetchProducts)
		.then( (result) => {
			return true; 
		} ) 
		.catch( function (error) {
			console.error(error);
			return true; 
		} ) ;
}

function swymRenderWishlist(swat) {
	// Get wishlist items
	swat.fetch(function(products) {
		getProductInfo(products).then(result => {
			watchProductItemView();
		});

	});
}


if (!window.SwymCallbacks) {
	window.SwymCallbacks = [];
}
window.SwymCallbacks.push(swymRenderWishlist); /* Init Here */