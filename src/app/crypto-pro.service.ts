import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  getUserCertificates,
  isValidSystemSetup,
  getSystemInfo,
  createHash,
  createDetachedSignature,
  createXMLSignature
} from "crypto-pro";
import { getUserCertificatesWrap } from "./get-certs";

export class CryptoProPluginInfo {
  pluginVersion: string;
  cspVersion: string;

  constructor({ cadesVersion, cspVersion }) {
    this.pluginVersion = cadesVersion;
    this.cspVersion = cspVersion;
  }
}

export interface CertificateModel {
  issuerName: string;
  isValid: boolean;
  name: string;
  thumbprint: string;
  validFrom: string;
  validTo: string;
  class?: string;
}

@Injectable({
  providedIn: "root"
})
export class CryptoProService {
  constructor() {}

  isPluginValid(): Observable<boolean> {
    return from(isValidSystemSetup());
  }

  getPluginInfo(): Observable<CryptoProPluginInfo> {
    return from(getSystemInfo()).pipe(
      map(info => new CryptoProPluginInfo(info))
    );
  }

  getUserCertificates(): Observable<any> {
    return new Observable(observer =>
      from(getUserCertificatesWrap()).subscribe(observer)
    );
  }

  createFileSignature(thumbprint: string, fileBlob: Blob): Observable<any> {
    return new Observable(observer =>
      from(this.createFileDetachedSignature(thumbprint, fileBlob)).subscribe(
        observer
      )
    );
  }

  createXMLSignature(
    thumbprint: string,
    unencryptedMessage: string
  ): Observable<any> {
    return new Observable(observer =>
      from(
        this.createXMLSignaturePromise(thumbprint, unencryptedMessage)
      ).subscribe(observer)
    );
  }
  private async createXMLSignaturePromise(
    thumbprint: string,
    unencryptedMessage: string
  ) {
    return await createXMLSignature(thumbprint, unencryptedMessage);
  }

  private async createFileDetachedSignature(
    thumbprint: string,
    fileBlob: Blob
  ) {
    const data = await fileBlob.arrayBuffer();
    const hash = await createHash(data);
    const signature = await createDetachedSignature(thumbprint, hash);
    return signature;
  }
}
