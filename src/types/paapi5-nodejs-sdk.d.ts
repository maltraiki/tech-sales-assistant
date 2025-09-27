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
    }

    export class DefaultApi {
        searchItems(request: SearchItemsRequest, callback: (error: any, data: any) => void): void;
    }

    const ProductAdvertisingAPIv1: {
        ApiClient: typeof ApiClient;
        SearchItemsRequest: typeof SearchItemsRequest;
        DefaultApi: typeof DefaultApi;
    };

    export default ProductAdvertisingAPIv1;
}