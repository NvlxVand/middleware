import express from "express";
import fetch from "node-fetch";
import https from "https";
import fs from "fs";
import { DOMParser } from "xmldom";
import bodyParser from "body-parser";

const certificatePath = "./cert/ani-wcf.midassolutions.com.br.pfx";
const certificatePassword = "heroes";

const agent = new https.Agent({
  pfx: fs.readFileSync(certificatePath),
  passphrase: certificatePassword,
  rejectUnauthorized: false,
  secureProtocol: "TLSv1_2_method",
});

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// Handle form submission
app.get("/getToken", async (req, res) => {
  try {
    const authenticationResult = await authenticateRequest();
    if (authenticationResult.token) {
      const id = req.query.id;
      const name = req.query.name; 
      const email = req.query.email;
      if(!(id && name && email)) return  res.send("Missing id or name or email parameter")

      const tokenResult = await getToken(authenticationResult.token,id,name,email);
      res.send(tokenResult);
    } else {
      res.send(authenticationResult.message);
    }
  } catch (error) {
    res.status(500).send("Error occurred during authentication.");
  }
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const port = 5000; // You can choose any available port
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

function authenticateRequest() {
  const login = "GPA02";
  const password = "Sol@2021";
  const authenticateRequestBody = `<soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope' xmlns:tem='http://tempuri.org/'>
<soap:Header xmlns:wsa='http://www.w3.org/2005/08/addressing'>
<wsa:Action>http://tempuri.org/ITokenService/AuthenticateRequest</wsa:Action>
<wsa:To>https://ani-ws-cert.midassolutions.com.br/034/wcf_cert/TokenService.svc</wsa:To>
</soap:Header>
<soap:Body>
   <tem:AuthenticateRequest>
      <!--Optional:-->
      <tem:login>${login}</tem:login>
      <!--Optional:-->
      <tem:password>${password}</tem:password>
   </tem:AuthenticateRequest>
</soap:Body>
</soap:Envelope>`;

  const options = {
    method: "POST",
    headers: {
      Accept: "text/xml",
      "Content-Type": "application/soap+xml; charset=utf-8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      SOAPAction: "http://tempuri.org/ITokenService/AuthenticateRequest",
      "User-Agent": "axios/1.4.0",
      "Content-Length": authenticateRequestBody.length,
      "Accept-Encoding": "gzip, compress, deflate, br",
    },
    agent: agent,
    body: authenticateRequestBody,
  };

  return new Promise((resolve, reject) => {
    fetch(
      "https://ani-ws-cert.midassolutions.com.br/034/wcf_cert/TokenService.svc",
      options
    )
      .then((response) => response.text())
      .then((data) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        const token = xmlDoc.getElementsByTagName(
          "AuthenticateRequestResult"
        )[0];
        const error = xmlDoc.getElementsByTagName("s:Text")[0];
        let result = token
          ? { error: false, token: token.textContent }
          : { error: true, message: error.textContent };

        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getToken(token,login,name,email) {
  const getTokenBody = `<soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope' xmlns:tem='http://tempuri.org/'>
  <soap:Header xmlns:wsa='http://www.w3.org/2005/08/addressing'>
 <wsa:Action>http://tempuri.org/ITokenService/GenerateToken</wsa:Action>
 <wsa:To>https://ani-ws-cert.midassolutions.com.br/034/wcf_cert/TokenService.svc</wsa:To>
  </soap:Header>
  <soap:Body>
   <tem:GenerateToken>
    <!--Optional:-->
    <tem:guid>${token}</tem:guid>
    <!--Optional:-->
    <tem:login>${login}</tem:login>
    <!--Optional:-->
    <tem:name>${name}</tem:name>
    <!--Optional:-->
    <tem:email>${email}</tem:email>
   </tem:GenerateToken>
  </soap:Body>
</soap:Envelope>`

  const options = {
    method: "POST",
    headers: {
      Accept: "text/xml",
      "Content-Type": "application/soap+xml; charset=utf-8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      SOAPAction: "http://tempuri.org/ITokenService/GenerateToken",
      "User-Agent": "axios/1.4.0",
      "Content-Length": getTokenBody.length,
      "Accept-Encoding": "gzip, compress, deflate, br",
    },
    agent: agent,
    body: getTokenBody,
  };

  return new Promise((resolve, reject) => {
    fetch(
      "https://ani-ws-cert.midassolutions.com.br/034/wcf_cert/TokenService.svc",
      options
    )
      .then((response) => response.text())
      .then((data) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        const token = xmlDoc.getElementsByTagName("b:Token")[0];
        const error = xmlDoc.getElementsByTagName("s:Text")[0];
        let result = token
          ? { error: false, token: token.textContent }
          : { error: true, message: error.textContent };

        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
