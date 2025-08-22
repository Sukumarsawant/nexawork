-- Business Tables Setup for Supabase
-- This script creates the necessary tables for business functionality

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    cover_letter TEXT,
    proposed_amount DECIMAL(10,2),
    estimated_duration INTEGER, -- in days
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    milestones JSONB, -- Array of milestone objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT DEFAULT 'escrow' CHECK (payment_type IN ('escrow', 'direct', 'milestone')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    company_name TEXT,
    company_url TEXT,
    location TEXT,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
    seniority_level TEXT CHECK (seniority_level IN ('entry', 'junior', 'mid-level', 'senior', 'lead', 'executive')),
    job_function TEXT,
    industries_sector TEXT,
    posted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft', 'expired')),
    applications_count INTEGER DEFAULT 0,
    posted_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_job_id ON proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_proposals_student_id ON proposals(student_id);
CREATE INDEX IF NOT EXISTS idx_proposals_job_owner_id ON proposals(job_owner_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

CREATE INDEX IF NOT EXISTS idx_contracts_job_id ON contracts(job_id);
CREATE INDEX IF NOT EXISTS idx_contracts_student_id ON contracts(student_id);
CREATE INDEX IF NOT EXISTS idx_contracts_business_id ON contracts(business_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);

-- Enable Row Level Security (RLS)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposals
CREATE POLICY "Users can view proposals for their jobs" ON proposals
    FOR SELECT USING (auth.uid() = job_owner_id);

CREATE POLICY "Users can view their own proposals" ON proposals
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create proposals" ON proposals
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Job owners can update proposal status" ON proposals
    FOR UPDATE USING (auth.uid() = job_owner_id);

-- RLS Policies for contracts
CREATE POLICY "Users can view contracts they're involved in" ON contracts
    FOR SELECT USING (auth.uid() IN (student_id, business_id));

CREATE POLICY "Businesses can create contracts" ON contracts
    FOR INSERT WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Contract parties can update their contracts" ON contracts
    FOR UPDATE USING (auth.uid() IN (student_id, business_id));

-- RLS Policies for payments
CREATE POLICY "Users can view payments they're involved in" ON payments
    FOR SELECT USING (auth.uid() IN (business_id, student_id));

CREATE POLICY "Businesses can create payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Payment parties can update payments" ON payments
    FOR UPDATE USING (auth.uid() IN (business_id, student_id));

-- RLS Policies for jobs
CREATE POLICY "Anyone can view open jobs" ON jobs
    FOR SELECT USING (status = 'open');

CREATE POLICY "Users can view their own jobs" ON jobs
    FOR SELECT USING (auth.uid() = posted_by);

CREATE POLICY "Users can create jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can update their own jobs" ON jobs
    FOR UPDATE USING (auth.uid() = posted_by);

CREATE POLICY "Users can delete their own jobs" ON jobs
    FOR DELETE USING (auth.uid() = posted_by);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO authenticated;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs SET applications_count = applications_count - 1 WHERE id = OLD.job_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update job applications count
CREATE TRIGGER trigger_update_job_applications_count
    AFTER INSERT OR DELETE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_job_applications_count();

-- Insert sample data for testing
INSERT INTO jobs (title, description, company_name, location, salary_min, salary_max, employment_type, seniority_level, job_function, posted_by, status)
VALUES 
    ('Frontend Developer Intern', 'Looking for a talented frontend developer intern to join our team', 'TechCorp Inc.', 'Remote', 25000, 35000, 'internship', 'entry', 'Engineering', '00000000-0000-0000-0000-000000000001', 'open'),
    ('UI/UX Designer', 'Creative UI/UX designer needed for mobile app design', 'Design Studio', 'Mumbai', 40000, 60000, 'full-time', 'mid-level', 'Design', '00000000-0000-0000-0000-000000000001', 'open')
ON CONFLICT DO NOTHING;
