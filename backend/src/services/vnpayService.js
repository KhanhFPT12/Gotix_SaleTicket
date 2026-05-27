const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj){
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const buildPaymentUrl = (req, transactionId, amount, returnUrlOverride) => {
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  let vnpUrl = process.env.VNP_URL;
  const returnUrl = returnUrlOverride || process.env.VNP_RETURN_URL;

  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  
  // Calculate expire date (15 minutes from now)
  const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

  const ipAddr = req.headers['x-forwarded-for'] ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress || '127.0.0.1';

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = transactionId;
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + transactionId;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount * 100; // VNPay requires multiplying by 100
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  vnp_Params['vnp_ExpireDate'] = expireDate;

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

  return vnpUrl;
};

const verifyReturnUrl = (vnp_Params) => {
  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  const secretKey = process.env.VNP_HASH_SECRET;
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  if (secureHash === signed) {
    // Check vnp_ResponseCode == '00' outside or return here
    return { isSuccess: vnp_Params['vnp_ResponseCode'] === '00', code: vnp_Params['vnp_ResponseCode'], params: vnp_Params };
  } else {
    return { isSuccess: false, code: '97', params: vnp_Params }; // 97 is checksum failed
  }
};

module.exports = {
  buildPaymentUrl,
  verifyReturnUrl
};
