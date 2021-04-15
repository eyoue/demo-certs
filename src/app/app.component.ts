import { Component } from "@angular/core";
import { CryptoProService } from "./crypto-pro.service";
import { map, switchMap } from "rxjs/operators";
import * as JsonToXML from "js2xmlparser";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  rootField = "html";
  signField = "body";

  constructor(private cryptoProService: CryptoProService) {}

  jsonToXml(id) {
    const obj = {
      body: "xxx"
    };
    return JsonToXML.parse(this.rootField, obj)
      .replace(`<${this.signField}`, `<${this.signField} Id="${id}"`)
      .replace(/\r?\n/g, "");
  }

  downloadFile(text, filename = "filename.xml") {
    let pom = document.createElement("a");
    let bb = new Blob([text], { type: "text/plain" });

    pom.setAttribute("href", window.URL.createObjectURL(bb));
    pom.setAttribute("download", filename);

    pom.dataset.downloadurl = ["text/plain", pom.download, pom.href].join(":");
    pom.draggable = true;
    pom.classList.add("dragout");

    pom.click();
  }

  sign() {
    const id = `ID_${Date.now()}`;
    const xmlData = this.jsonToXml(id);
    // this.downloadFile(xmlData, "initial.xml");
    this.cryptoProService
      .getUserCertificates()
      .pipe(
        switchMap(certs => {
          const [cert] = certs;
          console.log(certs);
          return this.cryptoProService
            .createXMLSignature(cert.thumbprint, xmlData)
            .pipe(
              map(data =>
                data.replace(`URI=""`, `URI="#${id}"`).replace(/\r?\n/g, "")
              )
            );
        })
      )
      .subscribe(data => {
        // this.downloadFile(data, 'signed.xml')
      });
  }
}
