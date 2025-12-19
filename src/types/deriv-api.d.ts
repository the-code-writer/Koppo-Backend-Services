
declare module '@deriv/deriv-api/dist/DerivAPIBasic.js' {
    interface DerivAPIConfig {
        endpoint?: string;
        appId?: number;
        lang?: string;
        connection?: WebSocket; // Add this line
    }

    interface Subscription {
        unsubscribe: () => void;
    }

    interface BalanceResponse {
        balance?: {
            balance?: number;
            currency?: string;
        };
        error?: {
            message: string;
        };
    }

    interface Proposal {
        id: string;
        ask_price: number;
        display_value: string;
        payout: number;
        spot: number;
    }

    interface ProposalRequest {
        proposal: number;
        amount: number;
        barrier?: string;
        basis?: string;
        contract_type: string;
        currency: string;
        duration: number;
        duration_unit: string;
        symbol: string;
    }

    interface ProposalResponse {
        proposal?: {
            ask_price: number;
            display_value: string;
            id: string;
            payout: number;
            spot: number;
        };
        error?: {
            message: string;
        };
    }

    interface BuyRequest {
        buy: string;
        price: number;
        parameters?: {
            amount: number;
            basis: string;
            contract_type: string;
            currency: string;
            duration: number;
            duration_unit: string;
            symbol: string;
        };
    }

    interface BuyResponse {
        buy?: {
            contract_id?: string;
            [key: string]: any;
        };
        error?: {
            message: string;
        };
    }

    interface TickHistoryRequest {
        ticks_history: string;
        adjust_start_time?: number;
        count?: number;
        end?: string;
        start?: number;
        style?: string;
    }

    interface TickHistoryResponse {
        history?: {
            prices: number[];
            times: number[];
        };
        candles?: Array<{
            epoch: number;
            open: number;
            high: number;
            low: number;
            close: number;
        }>;
        error?: {
            message: string;
        };
    }

    export default class DerivAPIBasic {
        constructor(config: DerivAPIConfig);

        // Add all the methods you're using
        authorize(token: string): Promise<any>;
        balance(): Promise<BalanceResponse>;
        proposal(request: ProposalRequest): Promise<ProposalResponse>;
        buy(request: BuyRequest): Promise<any>;
        subscribe(request: any, callback?: (response: any) => void): Subscription | void;
        ticksHistory(request: TickHistoryRequest): Promise<TickHistoryResponse>;
        disconnect(): void;

        // Add other methods that might exist
        send?(request: any): Promise<any>;

        // Add connection property if it exists
        connection?: WebSocket;
    }

    interface DerivAPI {
        // Add methods you use from the API
        send: (request: any) => Promise<any>;
        subscribe: (request: any) => any;
        // Add other methods as needed
    }

    export default class DerivAPIBasic {
        constructor(config: DerivAPIConfig);
        // Add other properties/methods as needed
    }

}

declare module '@deriv/deriv-api' {
    export * from '@deriv/deriv-api/dist/DerivAPIBasic.js';
}