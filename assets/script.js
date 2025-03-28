document.addEventListener("DOMContentLoaded", function () {
  const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  const API_BASE_URL = 'https://www.moritaalumi.co.jp';
  const API_KEY = '3vbweMG6NhFDq4TChE4V';
  const { PDFDocument, rgb, PDFName, PDFString, TextAlignment } = PDFLib;
  const A3_WIDTH = 1190.55;
  const A3_HEIGHT = 841.89;
  const itemsPerPage = 9;
  const itemsPerRow = 3;
  const itemsPerColumn = 3;
  const defaultFontSize = 7;
  const imgMaxWidth = 56;
  const imgMaxHeight = 56;
  const productDetailX = 80;
  const productDetailMaxWidth = 60;
  let yuMinDbFont = null;

  async function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
    });
  }

  function getItemPositionX(basePositionX, itemColumn) {
    const itemWidth = 130;
    return basePositionX + itemColumn * itemWidth;
  }

  function getItemPositionY(basePositionY, itemRow) {
    const itemHeight = 76;
    return basePositionY + itemRow * itemHeight;
  }

  async function addFitImage(pdf, imageUrl, x, y, maxWidth, maxHeight) {
    const img = await loadImage(imageUrl);
    const imgWidth = img.width;
    const imgHeight = img.height;

    const widthRatio = maxWidth / imgWidth;
    const heightRatio = maxHeight / imgHeight;
    const scaleRatio = Math.min(widthRatio, heightRatio);

    const newWidth = imgWidth * scaleRatio;
    const newHeight = imgHeight * scaleRatio;

    const offsetX = (maxWidth - newWidth) / 2;
    const offsetY = (maxHeight - newHeight) / 2;

    pdf.addImage(img, "JPEG", x + offsetX, y + offsetY, newWidth, newHeight, '', 'FAST');
  }

  function getMetaData(itemElement, name) {
    const titles = itemElement.querySelectorAll('.c-metafield-info--on-grid .c-metafield-info__title');
    const targetTitle = Array.from(titles).find(title => title.textContent.trim() === name);
    let metaValue = '';

    if (targetTitle) {
        const content = targetTitle.nextElementSibling;
        if (content && content.classList.contains('c-metafield-info__content')) {
          metaValue = content.textContent.trim();
        }
    }

    return metaValue;
  }

  function getObjectDataLocalStorage(name) {
    const localStorageData = localStorage.getItem(name);
    if (!localStorageData) {
      console.error("No data found in localStorage:" + name);
      return;
    }

    try {
      return JSON.parse(localStorageData);
    } catch (error) {
      console.error("Error parsing data from localStorage:", error);
      return {};
    }
  }

  function getWishlistData() {
    let products = [];
    const allWishlist = getObjectDataLocalStorage('swym-products')?.all;
    
    const wishlist = document.querySelectorAll(`.swym-wishlist-grid li`);
    wishlist.forEach(itemElement => {
      const itemName = itemElement.querySelector('.swym-wishlist-item span').textContent;
      let item;
      allWishlist.forEach(i => {
        if (i.dt === itemName) {
          item = i;
        }
      });
      
      let textTopLeft = itemElement.querySelector('.c-metafield-info--on-grid .c-metafield-info__content:nth-child(1)')?.textContent || '';
      let imageUrl = itemElement.querySelector('.swym-wishlist-image-wrapper img.swym-wishlist-image')?.src || '';
      let title = itemElement.querySelector('.swym-title')?.textContent || '';
      let maker = getMetaData(itemElement, 'メーカー');
      let size = getMetaData(itemElement, 'サイズ');
      const metaTitleElement = Array.from(itemElement.querySelectorAll('.c-metafield-info--on-grid .c-metafield-info__title')).find(el => el?.textContent?.trim() === '品番');
      let sku = '';
      if (metaTitleElement) {
        sku = metaTitleElement.nextElementSibling.textContent.trim();
      }
      const variantTitleElement = itemElement.querySelector('.swym-variant-title');
      const variantInfo = variantTitleElement?.textContent.replace(variantTitleElement.querySelector('.c-metafield-info__title')?.textContent, '').trim();

      products.push({
        textTopLeft: textTopLeft,
        textTopRight: '',
        iu: imageUrl,
        dt: title,
        maker: maker,
        sku: sku,
        size: size,
        vi: variantInfo,
        du: item?.du ? item.du : '',
      });
    });

    return products;
  }

  function getEmailCc() {
    const emailCcInputs = Array.from(document.querySelectorAll(".email-cc"));
    return emailCcInputs
      .map(input => input.value.trim())
      .filter(value => value !== '');
  }

  async function uploadFileToGoogleDrive(fileBlob, fileName, accessToken) {
    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify({ name: fileName })], {
        type: "application/json",
      })
    );
    formData.append("file", fileBlob);

    const response = await fetch(DRIVE_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error uploading file to Google Drive");
    }

    const data = await response.json();
    return data.id;
  }

  async function setFilePermissions(fileId, accessToken) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Error granting permission:",
        response.status,
        response.statusText
      );
    }
  }

  async function getFileWebViewLink(fileId, accessToken) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.webViewLink;
    } else {
      console.error(
        "Error get file web view link:",
        response.status,
        response.statusText
      );
    }
  }

  async function sendEmailNotification(emailTo, emailCcStr, fileLink, company) {
    const payloadString = JSON.stringify({
      emailTo: emailTo,
      emailCc: emailCcStr,
      fileLink: fileLink,
      company: company,
    });
    const base64Encoded = btoa(payloadString);
    const response = await fetch(
      `${API_BASE_URL}/api_noizless/notification.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": API_KEY,
        },
        body: JSON.stringify({ data: base64Encoded }),
      }
    );

    if (!response.ok) {
      console.error(
        "Error sending notification:",
        response.status,
        response.statusText
      );
    }
    
    showMessage();
    setFormDefaultValue();
  }

  function showMessage() {
    var modal = document.getElementById("myModal");
    if (modal) {
      modal.classList.remove("show");
      modal.style.display = "none";
    }

    document.getElementById("popupMessage").style.display = "flex";
  }

  function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  var observer = new MutationObserver(function (mutationsList) {
    for (var mutation of mutationsList) {
      if (mutation.type === "childList") {
        var container = document.querySelector(
          ".swym-wishlist-context-menu-content"
        );

        if (container && !container.querySelector("button.new-button")) {
          var newButton = document.createElement("button");
          newButton.classList.add("new-button");
          newButton.classList.add("swym-wishlist-context-menu-item");
          newButton.classList.add("swym-is-button");

          var icon = document.createElement('span');
          icon.classList.add('fa', 'fa-envelope', 'swym-icon', 'font-awesome');
          newButton.appendChild(icon);

          var span = document.createElement("span");
          span.textContent = "リストを送信";
          newButton.appendChild(span);

          container.prepend(newButton);
        }
      }
    }
  });
  var targetNode = document.querySelector("#swym-wishlist-render-container");
  if (targetNode) {
    var config = { childList: true, subtree: true };
    observer.observe(targetNode, config);
  }

  // =====================================================================================================
  // ========================================= VALIDATE FORM =============================================
  // =====================================================================================================
  // firstname: required
  // lastname: required
  // email: required, is email
  // email-company: no required, is email
  // company: required when input email-company
  // email-cc: no required, is email
  function validateForm() {
    const firstname = document.getElementById("firstname").value.trim();
    const lastname = document.getElementById("lastname").value.trim();
    const email = document.getElementById("email").value.trim();
    const emailCompany = document.getElementById("email-company").value.trim();
    const company = document.getElementById("company").value.trim();
    let isValidEmailCompany = true;
    let isValidCompany = true;
    if (emailCompany) {
      isValidEmailCompany = validateEmail(emailCompany);
      isValidCompany = company !== '';
    }
    
    const emailCcInputs = document.querySelectorAll(".email-cc");
    const isValidEmailCc = Array.from(emailCcInputs).every(input => (input.value.trim() === '' || validateEmail(input.value.trim())));

    const isValid = firstname !== "" && lastname !== "" && validateEmail(email) && isValidEmailCompany && isValidCompany && isValidEmailCc;
    document.getElementById("sendMail").disabled = !isValid;
  }

  document.getElementById("firstname").addEventListener("input", validateForm);
  document.getElementById("lastname").addEventListener("input", validateForm);
  document.getElementById("email").addEventListener("input", validateForm);
  document.getElementById("email-company").addEventListener("input", validateForm);
  document.getElementById("company").addEventListener("input", validateForm);
  const emailCcInputs = document.querySelectorAll(".email-cc");
  emailCcInputs.forEach(input => {
    input.addEventListener("input", validateForm);
  });

  const ccContainer = document.getElementById('cc-container');
  const observerEmailCc = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.querySelector('input')) {
          const input = node.querySelector('input');
          input.addEventListener('input', validateForm);
        }
      });
    });
  });
  observerEmailCc.observe(ccContainer, { childList: true });

  // =====================================================================================================
  // ========================================= VALIDATE FORM =============================================
  // =====================================================================================================

  document.addEventListener("click", function (event) {
    if (event.target && event.target.closest(".new-button")) {
      var modal = document.getElementById("myModal");
      var contextMenuContent = document.querySelector(
        ".swym-wishlist-context-menu-content"
      );
      var contextMenuBg = document.querySelector(
        ".swym-wishlist-context-menu-bg"
      );

      if (contextMenuContent) {
        contextMenuContent.style.setProperty("display", "none", "important");
      }

      if (contextMenuBg) {
        contextMenuBg.style.setProperty("display", "none", "important");
      }
      if (modal) {
        modal.style.display = "block";
        setTimeout(function () {
          modal.classList.add("show");
          document.getElementById('firstname')?.focus();
        }, 10);
      }
      validateForm();
    }

    var closeModalButton = document.querySelector("#close-modal");
    if (closeModalButton) {
      closeModalButton.addEventListener("click", function () {
        var modal = document.getElementById("myModal");
        if (modal) {
          modal.classList.remove("show");
          modal.style.display = "none";
        }
      });
    }

    var closeMessageButton = document.querySelector("#close-message");
    if (closeMessageButton) {
      closeMessageButton.addEventListener("click", function () {
        document.getElementById("popupMessage").style.display = "none";
      });
    }
  });

  var sendMailButton = document.querySelector("#sendMail");
  if (sendMailButton) {
    sendMailButton.addEventListener("click", async function () {
      showLoading(true);
      try {
        await handleExportPdf();
      } finally {
        showLoading(false);
      }
    });
  }

  function showLoading(isShow) {
    var sendMailButton = document.querySelector("#sendMail");
    var buttonText = sendMailButton.querySelector(".buttonText");
    var spinner = sendMailButton.querySelector(".spinner");

    if (isShow) {
      sendMailButton.disabled = true;
      buttonText.innerText = "送信中";
      spinner.style.display = "inline-block";
    } else {
      sendMailButton.disabled = false;
      buttonText.innerText = "リストを送信する";
      spinner.style.display = "none";
    }
  }

  async function handleExportPdf() {
    let products = getWishlistData();
    const email = document.getElementById('email').value.trim();
    const emailCompany = document.getElementById("email-company").value.trim();
    let emailTo = email;
    if (emailCompany) {
      emailTo += ',' + emailCompany;
    }
    const company = document.getElementById('company').value.trim();
    const emailCc = getEmailCc();
    const emailCcStr = emailCc.join(',');

    // Get user name
    const firstname = document.getElementById("firstname").value.trim();
    const lastname = document.getElementById("lastname").value.trim();
    let userName = '';
    if (firstname) {
      userName += firstname;
    }
    if (lastname) {
      if (userName !== '') {
        userName += ' '
      }
      userName += lastname;
    }
    if (userName == '') {
      userName = 'ゲストショッパー';
    }

    // Get file no
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const fileNo = `No. ${year}${month}${day}-${hours}${minutes}${seconds}`;
    const fileName = `仕様一覧シート_${fileNo}.pdf`;
    
    const [token, pdfBlob] = await Promise.all([
      getToken(),
      createPDF(userName, fileNo, products)
    ]);

    const fileId = await uploadFileToGoogleDrive(pdfBlob, fileName, token);

    await setFilePermissions(fileId, token);

    // Get the file link after permissions have been set
    const fileLink = await getFileWebViewLink(fileId, token);

    // Send email
    await sendEmailNotification(emailTo, emailCcStr, fileLink, company);
  }

  function getItemPositionX(basePositionX, itemColumn) {
    const itemWidth = 130;
    return basePositionX + itemColumn * itemWidth;
  }
  
  function getItemPositionY(basePositionY, itemRow) {
    const itemHeight = 76;
    return basePositionY + itemRow * itemHeight;
  }
  
  async function getImageBytes(url) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to load image: ${response.statusText}`);
    return await response.arrayBuffer();
  }
  
  async function addFitImage(
    pdf,
    page,
    imageBytes,
    mmX,
    mmY,
    maxWidth,
    maxHeight
  ) {
    const byteArray = new Uint8Array(imageBytes);
    let image = null;
    if (byteArray[0] === 0xff && byteArray[1] === 0xd8) {
      image = await pdf.embedJpg(imageBytes);
    }
    if (
      byteArray[0] === 0x89 &&
      byteArray[1] === 0x50 &&
      byteArray[2] === 0x4e &&
      byteArray[3] === 0x47
    ) {
      image = await pdf.embedPng(imageBytes);
    }
  
    page.drawImage(image, {
      x: mmToPoints(mmX),
      y: A3_HEIGHT - mmToPoints(mmY),
      width: mmToPoints(maxWidth),
      height: mmToPoints(maxHeight),
    });
  }
  
  function mmToPoints(mm) {
    return mm * 2.83465;
  }
  
  function pointsToMm(points) {
    return points * 0.352778;
  }
  
  function setLayoutForNewPage(
    page,
    userName,
    fileNo,
    logoImage,
    itemsPerPage,
    itemsPerRow,
    itemsPerColumn,
    imgMaxWidth,
    imgMaxHeight,
    productDetailX
  ) {  
    // Add rectangle header
    page.drawRectangle({
      x: mmToPoints(10),
      y: A3_HEIGHT - mmToPoints(37),
      width: mmToPoints(400),
      height: mmToPoints(27),
      color: rgb(222 / 255, 222 / 255, 220 / 255),
    });
  
    // Add rectangle content
    page.drawRectangle({
      x: mmToPoints(10),
      y: A3_HEIGHT - mmToPoints(287),
      width: mmToPoints(400),
      height: mmToPoints(244),
      color: rgb(222 / 255, 222 / 255, 220 / 255),
    });
  
    // Add header - left
    let textUserInfo = `| ${userName}　　　様邸　　| 仕様一覧シート　| ${fileNo}`;
    page.drawText(textUserInfo, {
      x: mmToPoints(18),
      y: A3_HEIGHT - mmToPoints(26),
      font: yuMinDbFont,
      size: 15,
    });
  
    // Add header - right (logo)
    page.drawImage(logoImage, {
      x: mmToPoints(335),
      y: A3_HEIGHT - mmToPoints(29),
      width: mmToPoints(60),
      height: mmToPoints(11),
    });
  
    // Default layout for item
    for (let index = 0; index < itemsPerPage; index++) {
      const row = Math.floor((index % itemsPerPage) / itemsPerRow);
      const column = index % itemsPerColumn;
  
      // Add rectangle for each item
      page.drawRectangle({
        x: mmToPoints(getItemPositionX(18, column)),
        y: A3_HEIGHT - mmToPoints(getItemPositionY(121, row)),
        width: mmToPoints(124),
        height: mmToPoints(70),
        color: rgb(255 / 255, 255 / 255, 255 / 255),
      });
  
      // Add rectangle for item image
      page.drawRectangle({
        x: mmToPoints(getItemPositionX(18, column)),
        y: A3_HEIGHT - mmToPoints(getItemPositionY(121, row)),
        width: mmToPoints(imgMaxWidth),
        height: mmToPoints(imgMaxHeight),
        color: rgb(209 / 255, 210 / 255, 212 / 255),
      });
  
      // Line between product top and product content
      const lineTopStartX = getItemPositionX(18, column);
      const lineTopStartY = getItemPositionY(65, row);
      const lineTopEndX = getItemPositionX(142, column);
      const lineTopEndY = getItemPositionY(65, row);
      page.drawLine({
        start: {
          x: mmToPoints(lineTopStartX),
          y: A3_HEIGHT - mmToPoints(lineTopStartY) + 0.5,
        },
        end: {
          x: mmToPoints(lineTopEndX),
          y: A3_HEIGHT - mmToPoints(lineTopEndY) + 0.5,
        },
        color: rgb(0 / 255, 0 / 255, 0 / 255),
        thickness: 0.5,
      });
  
      // Line between manufacturer information and product details
      const lineItemStartX = getItemPositionX(productDetailX, column);
      const lineItemStartY = getItemPositionY(97, row);
      const lineItemEndX = getItemPositionX(142, column);
      const lineItemEndY = getItemPositionY(97, row);
      page.drawLine({
        start: {
          x: mmToPoints(lineItemStartX),
          y: A3_HEIGHT - mmToPoints(lineItemStartY) + 0.5,
        },
        end: {
          x: mmToPoints(lineItemEndX),
          y: A3_HEIGHT - mmToPoints(lineItemEndY) + 0.5,
        },
        color: rgb(0 / 255, 0 / 255, 0 / 255),
        thickness: 0.5,
      });
  
      // Footer
      page.drawText(
        "※商品に関するお問い合わせは各メーカー様にお願いいたします。",
        {
          x: mmToPoints(getItemPositionX(319, column)),
          y: A3_HEIGHT - mmToPoints(getItemPositionY(281, row)),
          font: yuMinDbFont,
          size: 8,
        }
      );
    }
  }
  
  function drawTextMultiLines(page, text, fontSize, x, y, maxWidth, maxLines) {
    let lineHeight = 5;
    const chars = text.split("");
    let line = "";
    let result = [];
    for (let n = 0; n < chars.length; n++) {
      const testLine = line + chars[n];
      const testWidth = yuMinDbFont.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > mmToPoints(maxWidth)) {
        if (result.length + 1 < maxLines) {
          result.push(line);
          line = chars[n];
        } else {
          line = line.slice(0, -1);
          line += "...";
          result.push(line);
          break;
        }
      } else {
        line = testLine;
      }
    }

    if (result.length === 0) {
      result.push(line);
    }
  
    let adjustedY = y;
    result.reverse().forEach((line) => {
      page.drawText(line, {
        x: mmToPoints(x),
        y: A3_HEIGHT - mmToPoints(adjustedY),
        font: yuMinDbFont,
        size: fontSize,
      });
      adjustedY -= lineHeight;
    });
  }

  function drawTextWithEllipsis(page, text, fontSize, x, y, maxWidth) {
    const chars = text.split("");
    let result = "";
    for (let n = 0; n < chars.length; n++) {
      const testLine = result + chars[n];
      const testWidth = yuMinDbFont.widthOfTextAtSize(testLine, fontSize);
  
      if (testWidth > mmToPoints(maxWidth)) {
        result = result.slice(0, -1);
        result += '...';
        break;
      } else {
        result = testLine
      }
    }

    page.drawText(result, {
      x: mmToPoints(x),
      y: A3_HEIGHT - mmToPoints(y),
      font: yuMinDbFont,
      size: fontSize,
    });
  }
  
  function createWebLinkAnnotation(pdf, url, rect, borderColor) {
    return pdf.context.register(
      pdf.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: rect,
        Border: [0, 0, 0],
        C: borderColor,
        A: {
          Type: 'Action',
          S: 'URI', 
          URI: PDFString.of(url),
        },
      }),
    );
  }
  
  function addLinkAnnotation(pdf, page, linkAnnotations){
    const existingAnnotations = page.node.get(PDFName.of('Annots'));
    if (existingAnnotations?.array) {
      existingAnnotations.array = existingAnnotations.array.concat(linkAnnotations);
    }
    page.node.set(PDFName.of('Annots'), pdf.context.obj(existingAnnotations));
  }
  
  async function createPDF(userName, fileNo, products) {    
    const pdf = await PDFDocument.create();
    const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
    const fontkit = window.fontkit;
    pdf.registerFontkit(fontkit);
    yuMinDbFont = await pdf.embedFont(fontBytes);
  
    // First, fetch all product images
    const promises = products.map(async (product) => {
      const imageBytes = await getImageBytes(product.iu);
      product.imageBytes = imageBytes;
      return product;
    });
  
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  
    // Load logo image
    const imageBytes = await fetch(logoImgSrc).then(res => res.arrayBuffer());
    const logoImage = await pdf.embedPng(imageBytes);
  
    // Load external link icon
    const externalLinkBytes = await fetch(externalLinkImgSrc).then(res => res.arrayBuffer());
    const externalLinkImage = await pdf.embedPng(externalLinkBytes);
  
    let page;
    let linkAnnotations = [];
    for (let i = 0; i < products.length; i++) {
      const itemRow = Math.floor((i % itemsPerPage) / itemsPerRow);
      const itemColumn = i % itemsPerColumn;
      const product = products[i];
  
      // Handle on new page
      if (i % itemsPerPage === 0) {
        // Add link annotations for current page, add reset linkAnnotations
        if (page && linkAnnotations.length > 0) {
          addLinkAnnotation(pdf, page, linkAnnotations);
          linkAnnotations = [];
        }
        
        // Add new page and layout
        page = pdf.addPage([A3_WIDTH, A3_HEIGHT]);
        setLayoutForNewPage(
          page,
          userName,
          fileNo,
          logoImage,
          itemsPerPage,
          itemsPerRow,
          itemsPerColumn,
          imgMaxWidth,
          imgMaxHeight,
          productDetailX
        );
      }
  
      // Text top left
      page.drawText(product.textTopLeft, {
        x: mmToPoints(getItemPositionX(23, itemColumn)),
        y: A3_HEIGHT - mmToPoints(getItemPositionY(60, itemRow)),
        font: yuMinDbFont,
        size: 10,
      });
  
      // Text top right
      const form = pdf.getForm();
      const textRight = form.createTextField(`textRight-${i + 1}`);
      textRight.setText("");
      textRight.setAlignment(TextAlignment.Right)
      textRight.addToPage(page, {
        x: mmToPoints(getItemPositionX(108, itemColumn)),
        y: A3_HEIGHT - mmToPoints(getItemPositionY(63, itemRow)),
        width: mmToPoints(28),
        height: mmToPoints(8),
        borderColor: rgb(1, 1, 1),
        font: yuMinDbFont
      });
      textRight.setFontSize(9);
  
      // Add product image
      await addFitImage(
        pdf,
        page,
        product.imageBytes,
        getItemPositionX(18, itemColumn),
        getItemPositionY(121, itemRow),
        imgMaxWidth,
        imgMaxHeight
      );
  
      // Text title
      let titleMatch = product.dt.match(/^([a-zA-Z\s'-]+)[-\s](.*)/);
      let title;
      let textTitleItemDetail;
  
      if (titleMatch) {
        title = titleMatch[1].trim();
        textTitleItemDetail = titleMatch[2]?.trim();
      } else {
        title = product.dt.trim();
        textTitleItemDetail = product.textTopLeft;
      }
      drawTextMultiLines(
        page,
        title,
        10,
        getItemPositionX(productDetailX, itemColumn),
        getItemPositionY(80, itemRow),
        productDetailMaxWidth,
        2
      );
      drawTextWithEllipsis(
        page,
        product.maker,
        defaultFontSize,
        getItemPositionX(productDetailX, itemColumn),
        getItemPositionY(86, itemRow),
        productDetailMaxWidth
      );
      drawTextWithEllipsis(
        page,
        "品番" + "　" + product.sku,
        defaultFontSize,
        getItemPositionX(productDetailX, itemColumn),
        getItemPositionY(91, itemRow),
        productDetailMaxWidth
      );
  
      // Text item details
      drawTextWithEllipsis(
        page,
        textTitleItemDetail,
        defaultFontSize,
        getItemPositionX(productDetailX, itemColumn),
        getItemPositionY(103, itemRow),
        productDetailMaxWidth
      );
      drawTextWithEllipsis(
        page,
        product.size,
        defaultFontSize,
        getItemPositionX(productDetailX, itemColumn),
        getItemPositionY(107, itemRow),
        productDetailMaxWidth
      );
      drawTextWithEllipsis(
        page,
        product.vi,
        defaultFontSize,
        getItemPositionX(productDetailX, itemColumn),
        getItemPositionY(111, itemRow),
        productDetailMaxWidth
      );

      // Product link
      const linkText = "商品詳細・お問い合わせ先はこちら ";
      const textX = getItemPositionX(productDetailX, itemColumn);
      const textY = getItemPositionY(116, itemRow);
  
      page.drawText(linkText, {
        x: mmToPoints(textX),
        y: A3_HEIGHT - mmToPoints(textY),
        font: yuMinDbFont,
        size: defaultFontSize,
        url: product.du,
      });
  
      const iconWidth = 3.1;
      const iconHeight = 3.1;
      const linkTextWidth = pointsToMm(
        yuMinDbFont.widthOfTextAtSize(linkText, defaultFontSize)
      );
      const iconX = textX + linkTextWidth;
      const iconY = textY + 0.5;
      page.drawImage(externalLinkImage, {
        x: mmToPoints(iconX),
        y: A3_HEIGHT - mmToPoints(iconY),
        width: mmToPoints(iconWidth),
        height: mmToPoints(iconHeight),
        url: product.du,
      });
      
      // Create link rectangle based on the y position of the text
      const linkRect = [mmToPoints(textX), A3_HEIGHT - mmToPoints(textY + 1), mmToPoints(textX + linkTextWidth + iconWidth + 2), A3_HEIGHT - mmToPoints(textY - iconHeight)];
      linkAnnotations.push(createWebLinkAnnotation(pdf, product.du, linkRect, [0, 0, 0]));
    }
    addLinkAnnotation(pdf, page, linkAnnotations);

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return blob;
  }


  async function getToken() {
    const accessTokenUrl = `${API_BASE_URL}/api_noizless/token.php`;
    try {
      const response = await fetch(accessTokenUrl, {
        method: 'GET',
        headers: {
          "X-Api-Key": API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Get token failed');
      }

      const data = await response.json();
      return atob(data.token);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function setFormDefaultValue() {
    const userinfo = getObjectDataLocalStorage('swym-authn')?.all?.regn?.userinfo;
    const firstnameInput = document.getElementById('firstname');
    const lastnameInput = document.getElementById('lastname');
    const emailInput = document.getElementById('email');
    const emailCompanyInput = document.getElementById('email-company');
    const companyInput = document.getElementById('company');
    const emailCc1Input = document.getElementById('email-cc-1');
    if (firstnameInput) {
      firstnameInput.value = userinfo?.lname ?? '';
    }
    if (lastnameInput) {
      lastnameInput.value = userinfo?.fname ?? '';
    }
    if (emailInput) {
      emailInput.value = userinfo?.em ?? '';
    }
    if (emailCompanyInput) {
      emailCompanyInput.value = '';
    }
    if (companyInput) {
      companyInput.value = '';
    }
    if (emailCc1Input) {
      emailCc1Input.value = '';
    }

    const ccContainer = document.getElementById('cc-container');
    if (ccContainer) {
      ccContainer.innerHTML = '';
    }

    updateEmailCcClass();
  }
  setFormDefaultValue();

});
