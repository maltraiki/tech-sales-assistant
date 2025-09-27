-- Create affiliate_data table for storing Amazon product data
CREATE TABLE IF NOT EXISTS affiliate_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asin VARCHAR(20) UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  detail_page_url TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'SAR',
  is_prime BOOLEAN DEFAULT false,
  is_fulfilled_by_amazon BOOLEAN DEFAULT false,
  rating DECIMAL(2,1),
  reviews_count INTEGER,
  lowest_price DECIMAL(10,2),
  savings_amount DECIMAL(10,2),
  savings_percentage INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  click_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create click_tracking table for analytics
CREATE TABLE IF NOT EXISTS click_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asin VARCHAR(20),
  product_name TEXT,
  affiliate_url TEXT NOT NULL,
  user_session_id VARCHAR(100),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  language VARCHAR(2) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_comparisons table
CREATE TABLE IF NOT EXISTS product_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product1_asin VARCHAR(20),
  product1_name TEXT,
  product2_asin VARCHAR(20),
  product2_name TEXT,
  comparison_count INTEGER DEFAULT 1,
  last_compared TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_data_asin ON affiliate_data(asin);
CREATE INDEX IF NOT EXISTS idx_affiliate_data_updated ON affiliate_data(last_updated);
CREATE INDEX IF NOT EXISTS idx_click_tracking_asin ON click_tracking(asin);
CREATE INDEX IF NOT EXISTS idx_click_tracking_session ON click_tracking(user_session_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_clicked ON click_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_comparisons_asins ON product_comparisons(product1_asin, product2_asin);

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_click_count(p_asin VARCHAR(20))
RETURNS void AS $$
BEGIN
  UPDATE affiliate_data
  SET click_count = click_count + 1
  WHERE asin = p_asin;
END;
$$ LANGUAGE plpgsql;

-- Function to increment search count
CREATE OR REPLACE FUNCTION increment_search_count(p_asin VARCHAR(20))
RETURNS void AS $$
BEGIN
  UPDATE affiliate_data
  SET search_count = search_count + 1
  WHERE asin = p_asin;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old data (24 hour cache limit for prices)
CREATE OR REPLACE FUNCTION clean_old_affiliate_data()
RETURNS void AS $$
BEGIN
  DELETE FROM affiliate_data
  WHERE last_updated < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;