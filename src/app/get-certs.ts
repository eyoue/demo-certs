import { Certificate } from "crypto";
import { CadesCertificate } from "crypto-pro";
import { CAPICOM_PROPID_KEY_PROV_INFO } from "crypto-pro/dist/constants";
import { _afterPluginsLoaded } from "crypto-pro/dist/helpers/_afterPluginsLoaded";
import { _extractMeaningfulErrorMessage } from "crypto-pro/dist/helpers/_extractMeaningfulErrorMessage";
import {
  _generateCadesFn,
  __cadesAsyncToken__,
  __createCadesPluginObject__
} from "crypto-pro/dist/helpers/_generateCadesFn";

let certificatesCache: Certificate[];

/**
 * Возвращает список сертификатов, доступных пользователю в системе
 *
 * @param resetCache = false - позволяет сбросить кэш ранее полученных сертификатов
 * @returns список сертификатов
 */
export const getUserCertificatesWrap = _afterPluginsLoaded(
  (resetCache: boolean = false): Certificate[] => {
    //@ts-ignore
    const { cadesplugin } = window;

    if (!resetCache && certificatesCache) {
      return certificatesCache;
    }

    return eval(
      _generateCadesFn(function getUserCertificates(): Certificate[] {
        let cadesStore;

        try {
          cadesStore =
            __cadesAsyncToken__ + __createCadesPluginObject__("CAdESCOM.Store");
        } catch (error) {
          console.error(error);

          throw new Error(
            _extractMeaningfulErrorMessage(error) ||
              "Ошибка при попытке доступа к хранилищу"
          );
        }

        try {
          void (
            __cadesAsyncToken__ +
            cadesStore.Open(
              cadesplugin.CAPICOM_CURRENT_USER_STORE,
              cadesplugin.CAPICOM_MY_STORE,
              cadesplugin.CADESCOM_CONTAINER_STORE,
              cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
            )
          );
        } catch (error) {
          console.error(error);

          throw new Error(
            _extractMeaningfulErrorMessage(error) ||
              "Ошибка при открытии хранилища"
          );
        }

        let cadesCertificates;
        let cadesCertificatesCount;

        try {
          cadesCertificates = __cadesAsyncToken__ + cadesStore.Certificates;

          if (cadesCertificates) {
            cadesCertificates =
              __cadesAsyncToken__ +
              cadesCertificates.Find(
                cadesplugin.CAPICOM_CERTIFICATE_FIND_TIME_VALID
              );

            /**
             * Не рассматриваются сертификаты, в которых отсутствует закрытый ключ
             * или не действительны на данный момент
             */
            cadesCertificates =
              __cadesAsyncToken__ +
              cadesCertificates.Find(
                cadesplugin.CAPICOM_CERTIFICATE_FIND_EXTENDED_PROPERTY,
                CAPICOM_PROPID_KEY_PROV_INFO
              );

            cadesCertificatesCount =
              __cadesAsyncToken__ + cadesCertificates.Count;
          }
        } catch (error) {
          console.error(error);

          throw new Error(
            _extractMeaningfulErrorMessage(error) ||
              "Ошибка получения списка сертификатов"
          );
        }

        if (!cadesCertificatesCount) {
          throw new Error("Нет доступных сертификатов");
        }

        const certificateList: Certificate[] = [];

        try {
          while (cadesCertificatesCount) {
            const cadesCertificate: CadesCertificate =
              __cadesAsyncToken__ +
              cadesCertificates.Item(cadesCertificatesCount);

            certificateList.push(
              new Certificate(
                //@ts-ignore
                cadesCertificate,
                //@ts-ignore
                _extractCommonName(
                  __cadesAsyncToken__ + cadesCertificate.SubjectName
                ),
                __cadesAsyncToken__ + cadesCertificate.IssuerName,
                __cadesAsyncToken__ + cadesCertificate.SubjectName,
                __cadesAsyncToken__ + cadesCertificate.Thumbprint,
                __cadesAsyncToken__ + cadesCertificate.ValidFromDate,
                __cadesAsyncToken__ + cadesCertificate.ValidToDate
              )
            );

            cadesCertificatesCount--;
          }
        } catch (error) {
          console.error(error);

          throw new Error(
            _extractMeaningfulErrorMessage(error) ||
              "Ошибка обработки сертификатов"
          );
        }

        cadesStore.Close();

        certificatesCache = certificateList;

        return certificatesCache;
      })
    );
  }
);
