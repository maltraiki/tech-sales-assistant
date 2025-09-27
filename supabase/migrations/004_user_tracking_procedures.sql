-- User session tracking and analytics procedures
-- Links conversations, comparisons, and clicks by user session

-- First, let's add session tracking and user_id to conversations table if not exists
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS user_session_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS comparison_query BOOLEAN DEFAULT FALSE;

-- Add indexes for session and user tracking
CREATE INDEX IF NOT EXISTS idx_conversations_session
ON conversations(user_session_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id
ON conversations(user_id);

-- Get user journey: conversation -> clicks -> potential conversion
CREATE OR REPLACE FUNCTION get_user_journey(
    p_session_id VARCHAR(100)
)
RETURNS TABLE (
    action_type TEXT,
    action_time TIMESTAMP WITH TIME ZONE,
    product_name TEXT,
    query TEXT,
    affiliate_url TEXT,
    language VARCHAR(2)
) AS $$
BEGIN
    RETURN QUERY
    -- Get conversations
    SELECT
        'search'::TEXT as action_type,
        c.created_at as action_time,
        NULL::TEXT as product_name,
        c.query,
        NULL::TEXT as affiliate_url,
        c.language
    FROM conversations c
    WHERE c.user_session_id = p_session_id

    UNION ALL

    -- Get clicks
    SELECT
        'click'::TEXT as action_type,
        ct.clicked_at as action_time,
        ct.product_name,
        NULL::TEXT as query,
        ct.affiliate_url,
        ct.language
    FROM click_tracking ct
    WHERE ct.user_session_id = p_session_id

    ORDER BY action_time;
END;
$$ LANGUAGE plpgsql;

-- Get user comparison patterns (what products they compare together)
CREATE OR REPLACE FUNCTION get_user_comparison_patterns(
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    conversation_id UUID,
    query TEXT,
    products_mentioned TEXT[],
    clicked_products TEXT[],
    conversion_rate DECIMAL(5,2),
    session_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH user_conversations AS (
        SELECT
            c.id,
            c.query,
            c.created_at,
            c.user_session_id,
            c.user_id
        FROM conversations c
        WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
          AND (p_session_id IS NULL OR c.user_session_id = p_session_id)
          AND c.comparison_query = true
    ),
    clicked_products AS (
        SELECT
            ct.user_session_id,
            ARRAY_AGG(DISTINCT ct.product_name) as clicked_products,
            COUNT(*) as click_count
        FROM click_tracking ct
        WHERE (p_session_id IS NULL OR ct.user_session_id = p_session_id)
        GROUP BY ct.user_session_id
    )
    SELECT
        uc.id,
        uc.query,
        -- Extract product names from query (simplified - you might want to enhance this)
        STRING_TO_ARRAY(
            REGEXP_REPLACE(
                LOWER(uc.query),
                '[^a-z0-9 ]',
                '',
                'g'
            ),
            ' vs '
        ) as products_mentioned,
        cp.clicked_products,
        CASE
            WHEN cp.click_count > 0 THEN 100.0
            ELSE 0.0
        END as conversion_rate,
        uc.created_at
    FROM user_conversations uc
    LEFT JOIN clicked_products cp ON uc.user_session_id = cp.user_session_id
    ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Track user engagement metrics
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    total_sessions BIGINT,
    avg_queries_per_session DECIMAL(5,2),
    avg_clicks_per_session DECIMAL(5,2),
    click_through_rate DECIMAL(5,2),
    returning_user_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH session_data AS (
        SELECT
            COUNT(DISTINCT user_id) as total_users,
            COUNT(DISTINCT user_session_id) as total_sessions,
            COUNT(*) as total_queries
        FROM conversations
        WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    click_data AS (
        SELECT
            COUNT(DISTINCT user_session_id) as sessions_with_clicks,
            COUNT(*) as total_clicks
        FROM click_tracking
        WHERE clicked_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    returning_users AS (
        SELECT
            COUNT(DISTINCT user_id) as returning_users
        FROM conversations
        WHERE user_id IN (
            SELECT DISTINCT user_id
            FROM conversations
            WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
            GROUP BY user_id
            HAVING COUNT(DISTINCT DATE(created_at)) > 1
        )
    )
    SELECT
        sd.total_users,
        cd.sessions_with_clicks as active_users,
        sd.total_sessions,
        ROUND(sd.total_queries::DECIMAL / NULLIF(sd.total_sessions, 0), 2) as avg_queries_per_session,
        ROUND(cd.total_clicks::DECIMAL / NULLIF(sd.total_sessions, 0), 2) as avg_clicks_per_session,
        ROUND((cd.sessions_with_clicks::DECIMAL / NULLIF(sd.total_sessions, 0)) * 100, 2) as click_through_rate,
        ROUND((ru.returning_users::DECIMAL / NULLIF(sd.total_users, 0)) * 100, 2) as returning_user_rate
    FROM session_data sd, click_data cd, returning_users ru;
END;
$$ LANGUAGE plpgsql;

-- Get session-based conversion funnel
CREATE OR REPLACE FUNCTION get_session_conversion_funnel(
    p_session_id VARCHAR(100)
)
RETURNS TABLE (
    stage TEXT,
    action_time TIMESTAMP WITH TIME ZONE,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Initial query
    SELECT
        'Query Submitted'::TEXT,
        MIN(created_at),
        STRING_AGG(query, ' | ')
    FROM conversations
    WHERE user_session_id = p_session_id
    GROUP BY user_session_id

    UNION ALL

    -- Product views (assuming we track when results are shown)
    SELECT
        'Results Viewed'::TEXT,
        MIN(created_at) + INTERVAL '2 seconds',
        COUNT(*)::TEXT || ' queries made'
    FROM conversations
    WHERE user_session_id = p_session_id
    GROUP BY user_session_id

    UNION ALL

    -- Clicks
    SELECT
        'Product Clicked'::TEXT,
        MIN(clicked_at),
        STRING_AGG(DISTINCT product_name, ', ')
    FROM click_tracking
    WHERE user_session_id = p_session_id
    GROUP BY user_session_id

    ORDER BY action_time;
END;
$$ LANGUAGE plpgsql;

-- Get product affinity (products often compared together)
CREATE OR REPLACE FUNCTION get_product_affinity(
    p_min_comparisons INTEGER DEFAULT 2
)
RETURNS TABLE (
    product1 TEXT,
    product2 TEXT,
    comparison_count BIGINT,
    avg_clicks DECIMAL(5,2),
    affinity_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH comparisons AS (
        SELECT
            pc.product1_name,
            pc.product2_name,
            pc.comparison_count,
            pc.id
        FROM product_comparisons pc
        WHERE pc.comparison_count >= p_min_comparisons
    ),
    click_data AS (
        SELECT
            c.product1_name,
            c.product2_name,
            COUNT(ct.id) as click_count
        FROM comparisons c
        LEFT JOIN click_tracking ct ON
            (ct.product_name = c.product1_name OR ct.product_name = c.product2_name)
            AND ct.clicked_at >= NOW() - INTERVAL '30 days'
        GROUP BY c.product1_name, c.product2_name
    )
    SELECT
        cd.product1_name,
        cd.product2_name,
        c.comparison_count,
        ROUND(cd.click_count::DECIMAL / NULLIF(c.comparison_count, 0), 2) as avg_clicks,
        -- Affinity score based on frequency and engagement
        ROUND(
            (c.comparison_count * 0.3 + cd.click_count * 0.7)::DECIMAL,
            2
        ) as affinity_score
    FROM click_data cd
    JOIN comparisons c ON c.product1_name = cd.product1_name
        AND c.product2_name = cd.product2_name
    ORDER BY affinity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Get user lifetime value estimation
CREATE OR REPLACE FUNCTION get_user_lifetime_value(
    p_user_id UUID DEFAULT NULL,
    p_commission_rate DECIMAL DEFAULT 0.03
)
RETURNS TABLE (
    user_id UUID,
    total_sessions BIGINT,
    total_queries BIGINT,
    total_clicks BIGINT,
    first_seen DATE,
    last_seen DATE,
    days_active INTEGER,
    estimated_ltv DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH user_activity AS (
        SELECT
            c.user_id,
            COUNT(DISTINCT c.user_session_id) as sessions,
            COUNT(DISTINCT c.id) as queries,
            MIN(c.created_at)::DATE as first_seen,
            MAX(c.created_at)::DATE as last_seen
        FROM conversations c
        WHERE p_user_id IS NULL OR c.user_id = p_user_id
        GROUP BY c.user_id
    ),
    user_clicks AS (
        SELECT
            c.user_id,
            COUNT(ct.id) as clicks
        FROM conversations c
        JOIN click_tracking ct ON c.user_session_id = ct.user_session_id
        WHERE p_user_id IS NULL OR c.user_id = p_user_id
        GROUP BY c.user_id
    ),
    avg_price AS (
        SELECT AVG(price) as avg_price
        FROM affiliate_data
        WHERE price > 0
    )
    SELECT
        ua.user_id,
        ua.sessions,
        ua.queries,
        COALESCE(uc.clicks, 0) as total_clicks,
        ua.first_seen,
        ua.last_seen,
        (ua.last_seen - ua.first_seen)::INTEGER + 1 as days_active,
        -- Estimated LTV: clicks * conversion_rate * avg_price * commission
        ROUND(
            COALESCE(uc.clicks, 0) * 0.025 * ap.avg_price * p_commission_rate,
            2
        ) as estimated_ltv
    FROM user_activity ua
    LEFT JOIN user_clicks uc ON ua.user_id = uc.user_id
    CROSS JOIN avg_price ap
    ORDER BY estimated_ltv DESC;
END;
$$ LANGUAGE plpgsql;

-- Get real-time session activity
CREATE OR REPLACE FUNCTION get_active_sessions(
    p_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    session_id VARCHAR(100),
    user_id UUID,
    last_action TIMESTAMP WITH TIME ZONE,
    action_type TEXT,
    query_count BIGINT,
    click_count BIGINT,
    language VARCHAR(2)
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_conversations AS (
        SELECT
            user_session_id,
            user_id,
            MAX(created_at) as last_conversation,
            COUNT(*) as query_count,
            MAX(language) as language
        FROM conversations
        WHERE created_at >= NOW() - INTERVAL '1 minute' * p_minutes
        GROUP BY user_session_id, user_id
    ),
    recent_clicks AS (
        SELECT
            user_session_id,
            MAX(clicked_at) as last_click,
            COUNT(*) as click_count
        FROM click_tracking
        WHERE clicked_at >= NOW() - INTERVAL '1 minute' * p_minutes
        GROUP BY user_session_id
    )
    SELECT
        rc.user_session_id,
        rc.user_id,
        GREATEST(rc.last_conversation, COALESCE(rck.last_click, rc.last_conversation)) as last_action,
        CASE
            WHEN rck.last_click > rc.last_conversation THEN 'click'
            ELSE 'query'
        END as action_type,
        rc.query_count,
        COALESCE(rck.click_count, 0) as click_count,
        rc.language
    FROM recent_conversations rc
    LEFT JOIN recent_clicks rck ON rc.user_session_id = rck.user_session_id
    ORDER BY last_action DESC;
END;
$$ LANGUAGE plpgsql;

-- Track comparison to purchase journey
CREATE OR REPLACE FUNCTION track_comparison_to_click(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    comparison_type TEXT,
    total_comparisons BIGINT,
    comparisons_with_clicks BIGINT,
    click_rate DECIMAL(5,2),
    avg_time_to_click INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    WITH comparison_sessions AS (
        SELECT
            c.user_session_id,
            c.query,
            c.created_at as comparison_time,
            CASE
                WHEN c.query ILIKE '%vs%' OR c.query ILIKE '%compare%' THEN 'direct_comparison'
                WHEN c.query ILIKE '%best%' OR c.query ILIKE '%top%' THEN 'best_of'
                ELSE 'general_query'
            END as comparison_type
        FROM conversations c
        WHERE c.created_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    session_clicks AS (
        SELECT
            cs.user_session_id,
            cs.comparison_type,
            cs.comparison_time,
            MIN(ct.clicked_at) as first_click_time
        FROM comparison_sessions cs
        LEFT JOIN click_tracking ct ON cs.user_session_id = ct.user_session_id
            AND ct.clicked_at >= cs.comparison_time
        GROUP BY cs.user_session_id, cs.comparison_type, cs.comparison_time
    )
    SELECT
        sc.comparison_type,
        COUNT(*) as total_comparisons,
        COUNT(sc.first_click_time) as comparisons_with_clicks,
        ROUND(
            (COUNT(sc.first_click_time)::DECIMAL / COUNT(*)) * 100,
            2
        ) as click_rate,
        AVG(sc.first_click_time - sc.comparison_time) as avg_time_to_click
    FROM session_clicks sc
    GROUP BY sc.comparison_type
    ORDER BY click_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for session-based analytics dashboard
CREATE OR REPLACE VIEW session_analytics AS
SELECT
    DATE(c.created_at) as date,
    COUNT(DISTINCT c.user_session_id) as unique_sessions,
    COUNT(DISTINCT c.user_id) as unique_users,
    COUNT(c.id) as total_queries,
    COUNT(DISTINCT ct.id) as total_clicks,
    ROUND(
        COUNT(DISTINCT ct.user_session_id)::DECIMAL /
        NULLIF(COUNT(DISTINCT c.user_session_id), 0) * 100,
        2
    ) as session_click_rate,
    ROUND(
        COUNT(ct.id)::DECIMAL /
        NULLIF(COUNT(c.id), 0),
        2
    ) as clicks_per_query
FROM conversations c
LEFT JOIN click_tracking ct ON c.user_session_id = ct.user_session_id
    AND DATE(ct.clicked_at) = DATE(c.created_at)
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(c.created_at)
ORDER BY date DESC;

-- Function to mark conversations as comparison queries
CREATE OR REPLACE FUNCTION mark_comparison_queries()
RETURNS void AS $$
BEGIN
    UPDATE conversations
    SET comparison_query = true
    WHERE (
        query ILIKE '%vs%' OR
        query ILIKE '%compare%' OR
        query ILIKE '%versus%' OR
        query ILIKE '%او%' OR  -- Arabic "or"
        query ILIKE '%مقابل%' OR  -- Arabic "versus"
        query ILIKE '%ضد%'  -- Arabic "against"
    );
END;
$$ LANGUAGE plpgsql;