
import { createClient } from '@supabase/supabase-js';
import { LeadToolArgs } from '../types';

const supabaseUrl = 'https://gzjqoydbmfvryqxluvyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6anFveWRibWZ2cnlxeGx1dnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTY4MzEsImV4cCI6MjA3NDM5MjgzMX0.ApUqYFj9Pgo3h7k71kL1xpAxryIaoehbZiPffZ7l3JY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const saveLeadToSupabase = async (lead: LeadToolArgs) => {
  console.log("Saving lead:", lead);
  
  // Construct a rich summary
  const richSummary = `
[PROFILE DETAILS]
Age: ${lead.age || 'N/A'}
City: ${lead.city || 'N/A'}
Passport: ${lead.passportStatus || 'N/A'}
Experience: ${lead.experience || 'N/A'}
Best Time: ${lead.bestCallTime || 'N/A'}
Remarks: ${lead.remarks || 'None'}

[CONVERSATION SUMMARY]
${lead.summary || 'No summary provided'}
  `.trim();

  try {
    // 1. Check for existing lead with same phone within last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Sanitize phone for matching (remove spaces/dashes)
    const searchPhone = lead.contactInfo.replace(/\s+/g, '');

    // Simple check: match if phone column contains the number
    const { data: existingLeads, error: fetchError } = await supabase
      .from('ai_leads')
      .select('id, summary')
      .ilike('phone', `%${searchPhone}%`) // Fuzzy match to catch format variations
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1);

    if (fetchError) throw fetchError;

    if (existingLeads && existingLeads.length > 0) {
        // --- UPDATE EXISTING LEAD ---
        console.log("Updating existing lead:", existingLeads[0].id);
        const existingId = existingLeads[0].id;
        const newSummary = existingLeads[0].summary + "\n\n--- NEW INTERACTION ---\n" + richSummary;

        const { data, error } = await supabase
            .from('ai_leads')
            .update({ 
                summary: newSummary,
                interest: lead.interest, 
            })
            .eq('id', existingId)
            .select();

        if (error) throw error;
        return { success: true, data, action: 'updated' };

    } else {
        // --- INSERT NEW LEAD ---
        console.log("Creating new lead");
        const { data, error } = await supabase.from('ai_leads').insert([
          {
            name: lead.customerName,
            phone: lead.contactInfo,
            interest: lead.interest,
            language: lead.language || 'en',
            summary: richSummary
          }
        ]).select();

        if (error) throw error;
        return { success: true, data, action: 'created' };
    }

  } catch (err) {
    console.error("Save Error:", err);
    return { success: false, error: err };
  }
};

export const checkStatusInSupabase = async (identifier: string) => {
  console.log("Checking status for:", identifier);
  
  const inputDigits = identifier.replace(/\D/g, '');
  const inputLast10 = inputDigits.length >= 10 ? inputDigits.slice(-10) : inputDigits;
  const inputName = identifier.toLowerCase().trim();
  const isLikelyPhone = inputDigits.length > 5;

  try {
    const { data: apps, error } = await supabase
      .from('visa_applications')
      .select('status, form_data, phone_sanitized')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (apps && apps.length > 0) {
      const match = apps.find((row: any) => {
        const fd = row.form_data || {};
        
        if (isLikelyPhone) {
            if (row.phone_sanitized) {
                const dbPhone = String(row.phone_sanitized).replace(/\D/g, '');
                if (dbPhone.endsWith(inputLast10)) return true;
            }
            const possiblePhoneKeys = ['phone', 'mobile', 'phoneNumber', 'contact', 'contactNumber'];
            for (const key of possiblePhoneKeys) {
                if (fd[key]) {
                    const dbPhone = String(fd[key]).replace(/\D/g, '');
                    if (dbPhone.endsWith(inputLast10)) return true;
                }
            }
        } 
        
        if (!isLikelyPhone && inputName.length > 2) {
             const possibleNameKeys = ['name', 'fullName', 'Name', 'ClientName', 'applicant_name'];
             for (const key of possibleNameKeys) {
                 if (fd[key]) {
                     const dbName = String(fd[key]).toLowerCase();
                     if (dbName.includes(inputName)) return true;
                 }
             }
        }

        return false;
      });

      if (match) {
         const fd = match.form_data || {};
         const clientName = fd.name || fd.fullName || fd.Name || "Valued Client";
         const status = match.status || "Processing";
         
         return { 
            found: true, 
            responseString: `Okay ji, good news! I found the application for ${clientName}. The current status is: ${status}.`
         };
      }
    }
    
    return { 
        found: false,
        responseString: "Umm, sorry ji, I cannot find a file with that name or number. Could you please repeat it?"
    };
  } catch (err) {
    console.error("Status Check Error:", err);
    return { found: false, responseString: "Oh dear, the system is a little slow. Can you tell me the details again?" };
  }
};

export const checkEmployeeInSupabase = async (identifier: string) => {
  console.log("Checking employee:", identifier);
  
  // Basic cleaning
  const cleanIdentifier = identifier.trim();
  const isNumeric = /^\d+$/.test(cleanIdentifier.replace(/\s/g, ''));
  
  try {
    let query = supabase.from('employees').select('*');

    // If it looks like a phone number (digits > 5)
    if (isNumeric && cleanIdentifier.length > 5) {
       const searchPhone = cleanIdentifier.replace(/\D/g, '');
       // We'll use ilike for fuzzy phone match or exact match depending on strictness
       query = query.ilike('phone', `%${searchPhone}%`);
    } 
    // If it looks like an ID (short numeric) or Name (text)
    else {
       // Using an 'OR' filter to check Name OR Employee ID
       query = query.or(`name.ilike.%${cleanIdentifier}%,employee_id.eq.${cleanIdentifier}`);
    }

    const { data, error } = await query.limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const emp = data[0];
      const name = emp.name || 'Unknown';
      const designation = emp.designation || 'Staff';
      const department = emp.department || 'Team';
      const status = (emp.status || 'active').toLowerCase();
      const empId = emp.employee_id || 'N/A';

      if (status === 'active') {
        return {
          found: true,
          responseString: `Hanjii, yes sir. ${name} is in our team. They are working as ${designation} in the ${department} department. Employee ID is ${empId}.`
        };
      } else {
        return {
          found: true,
          responseString: `Sir, ${name} (${designation}) hamare saath abhi active nahi hain. Vo job chor k ja chuke hain.`
        };
      }
    }

    return {
      found: false,
      responseString: "Sorry ji, I checked our records but I cannot find anyone with that name or ID in our active team list."
    };

  } catch (err) {
    console.error("Employee Check Error:", err);
    return { found: false, responseString: "System check failed temporarily." };
  }
};
