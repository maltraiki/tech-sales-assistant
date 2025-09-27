import { supabase } from './supabase.js';
import { Request } from 'express';

export interface ClickTrackingData {
    asin?: string;
    product_name?: string;
    affiliate_url: string;
    user_session_id?: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    language?: string;
}

// Generate a session ID for tracking
export function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Track affiliate link click
export async function trackClick(data: ClickTrackingData, req?: Request): Promise<void> {
    try {
        const trackingData = {
            ...data,
            clicked_at: new Date(),
            ip_address: data.ip_address || req?.ip || req?.socket?.remoteAddress,
            user_agent: data.user_agent || req?.headers['user-agent'],
            referrer: data.referrer || req?.headers['referer'],
            created_at: new Date()
        };

        // Insert click tracking data
        const { error: clickError } = await supabase
            .from('click_tracking')
            .insert(trackingData);

        if (clickError) {
            console.error('Error tracking click:', clickError);
        } else {
            console.log('Click tracked successfully:', {
                asin: data.asin,
                product: data.product_name,
                url: data.affiliate_url
            });
        }

        // Increment click count in affiliate_data table if ASIN is provided
        if (data.asin) {
            const { error: incrementError } = await supabase
                .rpc('increment_click_count', { p_asin: data.asin });

            if (incrementError) {
                console.error('Error incrementing click count:', incrementError);
            }
        }
    } catch (error) {
        console.error('Click tracking failed:', error);
    }
}

// Track product comparison
export async function trackComparison(
    product1_asin: string,
    product1_name: string,
    product2_asin: string,
    product2_name: string
): Promise<void> {
    try {
        // Check if comparison already exists
        const { data: existing } = await supabase
            .from('product_comparisons')
            .select('id, comparison_count')
            .or(`and(product1_asin.eq.${product1_asin},product2_asin.eq.${product2_asin}),and(product1_asin.eq.${product2_asin},product2_asin.eq.${product1_asin})`)
            .single();

        if (existing) {
            // Update existing comparison count
            const { error } = await supabase
                .from('product_comparisons')
                .update({
                    comparison_count: existing.comparison_count + 1,
                    last_compared: new Date()
                })
                .eq('id', existing.id);

            if (error) {
                console.error('Error updating comparison count:', error);
            }
        } else {
            // Create new comparison record
            const { error } = await supabase
                .from('product_comparisons')
                .insert({
                    product1_asin,
                    product1_name,
                    product2_asin,
                    product2_name,
                    comparison_count: 1,
                    last_compared: new Date()
                });

            if (error) {
                console.error('Error creating comparison record:', error);
            }
        }
    } catch (error) {
        console.error('Comparison tracking failed:', error);
    }
}

// Get click analytics for a specific ASIN
export async function getClickAnalytics(asin: string): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('affiliate_data')
            .select('click_count, search_count')
            .eq('asin', asin)
            .single();

        if (error) {
            console.error('Error fetching analytics:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Analytics fetch failed:', error);
        return null;
    }
}

// Get top performing products
export async function getTopProducts(limit: number = 10): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('affiliate_data')
            .select('*')
            .order('click_count', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching top products:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Top products fetch failed:', error);
        return [];
    }
}

// Clean old data (24 hour cache limit)
export async function cleanOldData(): Promise<void> {
    try {
        const { error } = await supabase
            .rpc('clean_old_affiliate_data');

        if (error) {
            console.error('Error cleaning old data:', error);
        } else {
            console.log('Old affiliate data cleaned successfully');
        }
    } catch (error) {
        console.error('Data cleanup failed:', error);
    }
}