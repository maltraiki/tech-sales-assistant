-- Additional stored procedures for analytics and reporting

-- Get top performing products by clicks
CREATE OR REPLACE FUNCTION get_top_products(
    p_limit INTEGER DEFAULT 10,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    asin VARCHAR(20),
    product_name TEXT,
    click_count INTEGER,
    search_count INTEGER,
    conversion_rate DECIMAL(5,2),
    last_clicked TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ad.asin,
        ad.product_name,
        ad.click_count,
        ad.search_count,
        CASE
            WHEN ad.search_count > 0
            THEN ROUND((ad.click_count::DECIMAL / ad.search_count) * 100, 2)
            ELSE 0
        END as conversion_rate,
        MAX(ct.clicked_at) as last_clicked
    FROM affiliate_data ad
    LEFT JOIN click_tracking ct ON ad.asin = ct.asin
    WHERE ad.last_updated >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY ad.asin, ad.product_name, ad.click_count, ad.search_count
    ORDER BY ad.click_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get click statistics by time period
CREATE OR REPLACE FUNCTION get_click_stats(
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
    total_clicks BIGINT,
    unique_sessions BIGINT,
    unique_products BIGINT,
    avg_clicks_per_session DECIMAL(5,2),
    most_clicked_product TEXT,
    most_clicked_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH click_summary AS (
        SELECT
            COUNT(*) as total,
            COUNT(DISTINCT user_session_id) as sessions,
            COUNT(DISTINCT asin) as products
        FROM click_tracking
        WHERE clicked_at BETWEEN p_start_date AND p_end_date
    ),
    top_product AS (
        SELECT
            product_name,
            COUNT(*) as click_count
        FROM click_tracking
        WHERE clicked_at BETWEEN p_start_date AND p_end_date
        GROUP BY product_name
        ORDER BY click_count DESC
        LIMIT 1
    )
    SELECT
        cs.total,
        cs.sessions,
        cs.products,
        CASE
            WHEN cs.sessions > 0
            THEN ROUND(cs.total::DECIMAL / cs.sessions, 2)
            ELSE 0
        END,
        tp.product_name,
        tp.click_count::INTEGER
    FROM click_summary cs, top_product tp;
END;
$$ LANGUAGE plpgsql;

-- Get comparison trends
CREATE OR REPLACE FUNCTION get_comparison_trends(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    product1_name TEXT,
    product2_name TEXT,
    comparison_count INTEGER,
    last_compared TIMESTAMP WITH TIME ZONE,
    trend_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.product1_name,
        pc.product2_name,
        pc.comparison_count,
        pc.last_compared,
        -- Calculate trend score based on recency and frequency
        ROUND(
            pc.comparison_count::DECIMAL *
            (1 + (1.0 / (EXTRACT(EPOCH FROM (NOW() - pc.last_compared)) / 86400 + 1))),
            2
        ) as trend_score
    FROM product_comparisons pc
    ORDER BY trend_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get hourly click distribution
CREATE OR REPLACE FUNCTION get_hourly_clicks(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    hour_of_day INTEGER,
    click_count BIGINT,
    avg_clicks_per_hour DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(HOUR FROM clicked_at)::INTEGER as hour_of_day,
        COUNT(*) as click_count,
        ROUND(COUNT(*)::DECIMAL / p_days, 2) as avg_clicks_per_hour
    FROM click_tracking
    WHERE clicked_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY hour_of_day
    ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql;

-- Get conversion funnel (searches -> clicks -> potential sales)
CREATE OR REPLACE FUNCTION get_conversion_funnel(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    stage TEXT,
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
DECLARE
    v_searches BIGINT;
    v_clicks BIGINT;
    v_unique_sessions BIGINT;
BEGIN
    -- Get total searches
    SELECT COALESCE(SUM(search_count), 0) INTO v_searches
    FROM affiliate_data
    WHERE last_updated >= NOW() - INTERVAL '1 day' * p_days;

    -- Get total clicks
    SELECT COUNT(*) INTO v_clicks
    FROM click_tracking
    WHERE clicked_at >= NOW() - INTERVAL '1 day' * p_days;

    -- Get unique sessions that clicked
    SELECT COUNT(DISTINCT user_session_id) INTO v_unique_sessions
    FROM click_tracking
    WHERE clicked_at >= NOW() - INTERVAL '1 day' * p_days;

    RETURN QUERY
    SELECT 'Product Searches'::TEXT, v_searches, 100.00
    UNION ALL
    SELECT 'Affiliate Clicks'::TEXT, v_clicks,
           CASE WHEN v_searches > 0
                THEN ROUND((v_clicks::DECIMAL / v_searches) * 100, 2)
                ELSE 0 END
    UNION ALL
    SELECT 'Unique Sessions'::TEXT, v_unique_sessions,
           CASE WHEN v_searches > 0
                THEN ROUND((v_unique_sessions::DECIMAL / v_searches) * 100, 2)
                ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Update product prices from API (for scheduled updates)
CREATE OR REPLACE FUNCTION update_product_price(
    p_asin VARCHAR(20),
    p_price DECIMAL(10,2),
    p_lowest_price DECIMAL(10,2),
    p_savings_amount DECIMAL(10,2),
    p_savings_percentage INTEGER,
    p_is_prime BOOLEAN,
    p_is_fulfilled_by_amazon BOOLEAN
)
RETURNS void AS $$
BEGIN
    UPDATE affiliate_data
    SET
        price = p_price,
        lowest_price = p_lowest_price,
        savings_amount = p_savings_amount,
        savings_percentage = p_savings_percentage,
        is_prime = p_is_prime,
        is_fulfilled_by_amazon = p_is_fulfilled_by_amazon,
        last_updated = NOW()
    WHERE asin = p_asin;
END;
$$ LANGUAGE plpgsql;

-- Get products needing price updates (older than 24 hours)
CREATE OR REPLACE FUNCTION get_stale_products()
RETURNS TABLE (
    asin VARCHAR(20),
    product_name TEXT,
    hours_since_update DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ad.asin,
        ad.product_name,
        ROUND(EXTRACT(EPOCH FROM (NOW() - ad.last_updated)) / 3600, 2) as hours_since_update
    FROM affiliate_data ad
    WHERE ad.last_updated < NOW() - INTERVAL '24 hours'
    ORDER BY ad.click_count DESC, ad.last_updated ASC;
END;
$$ LANGUAGE plpgsql;

-- Get language preference analytics
CREATE OR REPLACE FUNCTION get_language_stats()
RETURNS TABLE (
    language VARCHAR(2),
    total_clicks BIGINT,
    percentage DECIMAL(5,2)
) AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM click_tracking;

    RETURN QUERY
    SELECT
        ct.language,
        COUNT(*) as total_clicks,
        CASE WHEN v_total > 0
             THEN ROUND((COUNT(*)::DECIMAL / v_total) * 100, 2)
             ELSE 0 END as percentage
    FROM click_tracking ct
    GROUP BY ct.language
    ORDER BY total_clicks DESC;
END;
$$ LANGUAGE plpgsql;

-- Clean up old click tracking data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_clicks()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM click_tracking
    WHERE clicked_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Get revenue estimate (based on typical Amazon commission rates)
CREATE OR REPLACE FUNCTION estimate_revenue(
    p_days INTEGER DEFAULT 30,
    p_commission_rate DECIMAL DEFAULT 0.03  -- 3% default commission
)
RETURNS TABLE (
    total_clicks BIGINT,
    estimated_conversion_rate DECIMAL(5,2),
    estimated_conversions INTEGER,
    avg_product_price DECIMAL(10,2),
    estimated_revenue DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH click_data AS (
        SELECT COUNT(*) as clicks
        FROM click_tracking
        WHERE clicked_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    price_data AS (
        SELECT AVG(price) as avg_price
        FROM affiliate_data
        WHERE price IS NOT NULL AND price > 0
    )
    SELECT
        cd.clicks,
        2.5::DECIMAL as estimated_conversion_rate, -- Industry avg 2.5%
        ROUND(cd.clicks * 0.025)::INTEGER as estimated_conversions,
        ROUND(pd.avg_price, 2) as avg_product_price,
        ROUND(cd.clicks * 0.025 * pd.avg_price * p_commission_rate, 2) as estimated_revenue
    FROM click_data cd, price_data pd;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_click_tracking_clicked_hour
ON click_tracking(EXTRACT(HOUR FROM clicked_at));

CREATE INDEX IF NOT EXISTS idx_affiliate_data_last_updated
ON affiliate_data(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_product_comparisons_trend
ON product_comparisons(comparison_count DESC, last_compared DESC);

-- Create a materialized view for daily stats (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_stats AS
SELECT
    DATE(clicked_at) as click_date,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT user_session_id) as unique_sessions,
    COUNT(DISTINCT asin) as unique_products,
    COUNT(DISTINCT ip_address) as unique_ips
FROM click_tracking
GROUP BY DATE(clicked_at)
ORDER BY click_date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(click_date DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_stats;
END;
$$ LANGUAGE plpgsql;