import { NextResponse } from 'next/server';

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCompanyDetails(snippets: string[], vkn: string) {
  let name = '';
  let taxOffice = '';
  let address = '';

  // 1. Structured Label matching (e.g. "Ünvanı: ...", "Firma Ünvanı: ...")
  for (const snippet of snippets) {
    const unvanMatch = snippet.match(/(?:Ünvanı|Firma Ünvanı|Firma Uzun Ünvanı)\s*:\s*([^:\n,]+?)(?:\s+Firma|\s+Mersis|\s+Sponsor|\s+Kuruluş|$)/i);
    if (unvanMatch && unvanMatch[1]) {
      const candidate = cleanText(unvanMatch[1]);
      if (candidate.length > 5 && !candidate.toLowerCase().includes('sorgulayabilirsiniz')) {
        name = candidate;
      }
    }

    const vdMatch = snippet.match(/(?:Vergi Dairesi)\s*:\s*([^:\n,]+?)(?:\s+Vergi|$)/i);
    if (vdMatch && vdMatch[1]) {
      taxOffice = cleanText(vdMatch[1]);
    }
  }

  // 2. Scan for uppercase words containing company indicators if not resolved
  if (!name) {
    for (const snippet of snippets) {
      const companyRegex = /([A-ZÇĞİÖŞÜ\d\-]+(?:\s+[A-ZÇĞİÖŞÜ\d\-&]+){1,15}\s+(?:ANONİM|LİMİTED|LTD|A\.Ş\.|ŞTİ\.|ORTAKLIĞI|MÜDÜRLÜĞÜ)[A-ZÇĞİÖŞÜ\s\d\-\.,]*)/i;
      const match = snippet.match(companyRegex);
      if (match && match[1]) {
        let candidate = cleanText(match[1]);
        candidate = candidate.replace(/\s+firmasına\s+ait.*/i, '');
        candidate = candidate.replace(/\s+şirketi\s+tarafından.*/i, '');
        candidate = candidate.replace(/Ticaret Sicil.*/gi, '');
        if (candidate.length > 8 && !candidate.toLowerCase().includes('sorgulayabilirsiniz')) {
          name = candidate;
          break;
        }
      }
    }
  }

  // 3. Scan for Vergi Dairesi
  if (!taxOffice) {
    for (const snippet of snippets) {
      const vdRegex = /([A-ZÇĞİÖŞÜ\d\-]+(?:\s+[A-ZÇĞİÖŞÜ\d\-&]+){0,4}\s+VERGİ\s+DAİRESİ)/i;
      const match = snippet.match(vdRegex);
      if (match && match[1]) {
        taxOffice = cleanText(match[1]);
        break;
      }
    }
  }

  // 4. Scan for address
  for (const snippet of snippets) {
    const addressMatch = snippet.match(/(?:Adres|Adresi|İş Yeri Adresi)\s*:\s*([^:\n,]+)/i);
    if (addressMatch && addressMatch[1]) {
      address = cleanText(addressMatch[1]);
      break;
    }
  }

  return { name, taxOffice, address };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vkn = searchParams.get('vkn');

  if (!vkn || vkn.length < 10 || vkn.length > 11) {
    return NextResponse.json(
      { error: 'Geçersiz VKN veya TCKN formatı.' },
      { status: 400 }
    );
  }

  // A. Check if environment VKN_API_KEY is configured
  const apiKey = process.env.VKN_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(`https://api.apideposu.com/v1/vkn-sorgula?vkn=${vkn}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          source: 'live_api',
          data: {
            name: data.unvan || data.name || data.title || '',
            taxOffice: data.vergi_dairesi || data.taxOffice || '',
            phone: data.telefon || data.phone || '',
            email: data.email || '',
            address: data.adres || data.address || ''
          }
        });
      }
    } catch (err) {
      console.error('VKN Live Query Error:', err);
    }
  }

  // B. Standard static mock list checks for immediate match
  const mockVknDirectory: Record<string, { name: string; taxOffice: string; phone: string; email: string; address: string }> = {
    '1234567890': {
      name: 'Özdemir Yapı Market A.Ş.',
      taxOffice: 'Beşiktaş',
      phone: '+90 212 555 44 33',
      email: 'siparis@ozdemirapi.com',
      address: 'Ihlamurdere Cad. No:12, Beşiktaş/İstanbul'
    },
    '9876543210': {
      name: 'İSKİ Genel Müdürlüğü',
      taxOffice: 'Aksaray',
      phone: '185',
      email: 'bilgi@iski.gov.tr',
      address: 'İSKİ Genel Md., Aksaray, Fatih/İstanbul'
    },
    '1112223334': {
      name: 'Yıldız Elektrik Malzemeleri Ltd. Şti.',
      taxOffice: 'Şişli',
      phone: '+90 212 222 33 44',
      email: 'info@yildizelektrik.com',
      address: 'Halaskargazi Cad. No:99, Şişli/İstanbul'
    },
    '5555555555': {
      name: 'Akel Temizlik Ürünleri San. Tic.',
      taxOffice: 'Kadıköy',
      phone: '+90 216 444 55 66',
      email: 'akel@temizlik.com',
      address: 'Moda Cad. No:12, Kadıköy/İstanbul'
    }
  };

  if (mockVknDirectory[vkn]) {
    return NextResponse.json({
      success: true,
      source: 'mock_database',
      data: mockVknDirectory[vkn]
    });
  }

  // C. Intelligent Web Scraper fallback to query real database directories without api credentials
  const querySuffixes = ['firma+unvan', 'vergi+dairesi', 'vkn', 'mükellef'];
  
  for (const suffix of querySuffixes) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${vkn}+${suffix}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const html = await response.text();
        const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        const snippets: string[] = [];
        while ((match = snippetRegex.exec(html)) !== null) {
          snippets.push(match[1]);
        }

        const details = extractCompanyDetails(snippets, vkn);
        if (details.name) {
          return NextResponse.json({
            success: true,
            source: 'search_registry_scrape',
            data: {
              name: details.name.toUpperCase(),
              taxOffice: details.taxOffice ? details.taxOffice.toUpperCase() : 'BİLİNMİYOR',
              phone: '',
              email: '',
              address: details.address || 'Türkiye'
            }
          });
        }
      }
    } catch (err) {
      console.warn(`Query suffix '${suffix}' failed:`, err);
    }
  }

  // D. Ultimate fallback: Dynamic generator in case scraping fails (no internet/blocked)
  const firstFour = vkn.substring(0, 4);
  const generatedName = `Cari Şirket No ${firstFour} San. Tic. A.Ş.`;
  return NextResponse.json({
    success: true,
    source: 'mock_generator',
    data: {
      name: generatedName,
      taxOffice: 'Marmara Kurumlar',
      phone: '+90 212 123 45 67',
      email: `muhasebe@cari${firstFour}.com`,
      address: 'Merkez Mah. İstiklal Cad. No:1, Kağıthane/İstanbul'
    }
  });
}
