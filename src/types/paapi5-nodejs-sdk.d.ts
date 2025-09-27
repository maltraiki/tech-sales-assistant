declare module 'paapi5-nodejs-sdk' {
    export class ApiClient {
        static instance: ApiClient;
        accessKey: string;
        secretKey: string;
        host: string;
        region: string;
    }

    export class SearchItemsRequest {
        PartnerTag?: string;
        PartnerType?: string;
        Keywords?: string;
        SearchIndex?: string;
        ItemCount?: number;
        Resources?: string[];
        Marketplace?: string;
        CurrencyOfPreference?: string;
        LanguagesOfPreference?: string[];
        Condition?: string;
        DeliveryFlags?: string[];
        SortBy?: string;
        [key: string]: any; // Allow indexing with string
    }

    export class GetItemsRequest {
        PartnerTag?: string;
        PartnerType?: string;
        ItemIds?: string[];
        ItemIdType?: string;
        Marketplace?: string;
        CurrencyOfPreference?: string;
        LanguagesOfPreference?: string[];
        Condition?: string;
        Resources?: string[];
    }

    export class DefaultApi {
        searchItems(request: SearchItemsRequest, callback: (error: any, data: any) => void): void;
        getItems(request: GetItemsRequest, callback: (error: any, data: any) => void): void;
    }

    const ProductAdvertisingAPIv1: {
        ApiClient: typeof ApiClient;
        SearchItemsRequest: typeof SearchItemsRequest;
        GetItemsRequest: typeof GetItemsRequest;
        DefaultApi: typeof DefaultApi;
    };

    export default ProductAdvertisingAPIv1;
}