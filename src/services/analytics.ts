import { supabase } from './supabase.js';

// Analytics data types
export interface ProductPerformance {
    asin: string;
    product_name: string;
    click_count: number;
    search_count: number;
    conversion_rate: number;
    last_clicked: Date;
}

export interface ClickStats {
    total_clicks: number;
    unique_sessions: number;
    unique_products: number;
    avg_clicks_per_session: number;
    most_clicked_product: string;
    most_clicked_count: number;
}

export interface ComparisonTrend {
    product1_name: string;
    product2_name: string;
    comparison_count: number;
    last_compared: Date;
    trend_score: number;
}

export interface ConversionFunnel {
    stage: string;
    count: number;
    percentage: number;
}

export interface RevenueEstimate {
    total_clicks: number;
    estimated_conversion_rate: number;
    estimated_conversions: number;
    avg_product_price: number;
    estimated_revenue: number;
}

// Get top performing products
export async function getTopProducts(limit: number = 10, days: number = 7): Promise<ProductPerformance[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_top_products', { p_limit: limit, p_days: days });

        if (error) {
            console.error('Error fetching top products:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get top products:', error);
        return [];
    }
}

// Get click statistics
export async function getClickStats(startDate?: Date, endDate?: Date): Promise<ClickStats | null> {
    try {
        const params: any = {};
        if (startDate) params.p_start_date = startDate.toISOString();
        if (endDate) params.p_end_date = endDate.toISOString();

        const { data, error } = await supabase
            .rpc('get_click_stats', params);

        if (error) {
            console.error('Error fetching click stats:', error);
            return null;
        }

        return data?.[0] || null;
    } catch (error) {
        console.error('Failed to get click stats:', error);
        return null;
    }
}

// Get comparison trends
export async function getComparisonTrends(limit: number = 10): Promise<ComparisonTrend[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_comparison_trends', { p_limit: limit });

        if (error) {
            console.error('Error fetching comparison trends:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get comparison trends:', error);
        return [];
    }
}

// Get hourly click distribution
export async function getHourlyClicks(days: number = 7): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_hourly_clicks', { p_days: days });

        if (error) {
            console.error('Error fetching hourly clicks:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get hourly clicks:', error);
        return [];
    }
}

// Get conversion funnel
export async function getConversionFunnel(days: number = 30): Promise<ConversionFunnel[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_conversion_funnel', { p_days: days });

        if (error) {
            console.error('Error fetching conversion funnel:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get conversion funnel:', error);
        return [];
    }
}

// Get language statistics
export async function getLanguageStats(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_language_stats');

        if (error) {
            console.error('Error fetching language stats:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get language stats:', error);
        return [];
    }
}

// Get revenue estimate
export async function getRevenueEstimate(days: number = 30, commissionRate: number = 0.03): Promise<RevenueEstimate | null> {
    try {
        const { data, error } = await supabase
            .rpc('estimate_revenue', {
                p_days: days,
                p_commission_rate: commissionRate
            });

        if (error) {
            console.error('Error estimating revenue:', error);
            return null;
        }

        return data?.[0] || null;
    } catch (error) {
        console.error('Failed to estimate revenue:', error);
        return null;
    }
}

// Get products needing price updates
export async function getStaleProducts(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_stale_products');

        if (error) {
            console.error('Error fetching stale products:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get stale products:', error);
        return [];
    }
}

// Update product price
export async function updateProductPrice(
    asin: string,
    price: number,
    lowestPrice: number,
    savingsAmount: number,
    savingsPercentage: number,
    isPrime: boolean,
    isFulfilledByAmazon: boolean
): Promise<boolean> {
    try {
        const { error } = await supabase
            .rpc('update_product_price', {
                p_asin: asin,
                p_price: price,
                p_lowest_price: lowestPrice,
                p_savings_amount: savingsAmount,
                p_savings_percentage: savingsPercentage,
                p_is_prime: isPrime,
                p_is_fulfilled_by_amazon: isFulfilledByAmazon
            });

        if (error) {
            console.error('Error updating product price:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to update product price:', error);
        return false;
    }
}

// Clean up old data
export async function cleanupOldData(): Promise<number> {
    try {
        // Clean old clicks
        const { data: clicksDeleted, error: clickError } = await supabase
            .rpc('cleanup_old_clicks');

        if (clickError) {
            console.error('Error cleaning old clicks:', error);
        }

        // Clean old affiliate data
        const { error: affiliateError } = await supabase
            .rpc('clean_old_affiliate_data');

        if (affiliateError) {
            console.error('Error cleaning old affiliate data:', affiliateError);
        }

        return clicksDeleted || 0;
    } catch (error) {
        console.error('Failed to cleanup old data:', error);
        return 0;
    }
}

// Refresh daily stats materialized view
export async function refreshDailyStats(): Promise<boolean> {
    try {
        const { error } = await supabase
            .rpc('refresh_daily_stats');

        if (error) {
            console.error('Error refreshing daily stats:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to refresh daily stats:', error);
        return false;
    }
}

// Get daily stats from materialized view
export async function getDailyStats(days: number = 30): Promise<any[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('daily_stats')
            .select('*')
            .gte('click_date', startDate.toISOString().split('T')[0])
            .order('click_date', { ascending: false });

        if (error) {
            console.error('Error fetching daily stats:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get daily stats:', error);
        return [];
    }
}

// Generate analytics report
export async function generateAnalyticsReport(days: number = 30): Promise<any> {
    try {
        const [
            topProducts,
            clickStats,
            comparisonTrends,
            conversionFunnel,
            languageStats,
            revenueEstimate,
            dailyStats
        ] = await Promise.all([
            getTopProducts(10, days),
            getClickStats(new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
            getComparisonTrends(10),
            getConversionFunnel(days),
            getLanguageStats(),
            getRevenueEstimate(days),
            getDailyStats(days)
        ]);

        return {
            period: `Last ${days} days`,
            generatedAt: new Date(),
            summary: {
                clickStats,
                revenueEstimate,
                conversionFunnel
            },
            topProducts,
            comparisonTrends,
            languageStats,
            dailyStats
        };
    } catch (error) {
        console.error('Failed to generate analytics report:', error);
        return null;
    }
}