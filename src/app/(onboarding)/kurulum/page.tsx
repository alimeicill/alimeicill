'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  MapPin, 
  Layers, 
  PieChart, 
  Users, 
  CreditCard, 
  Settings, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Info,
  DollarSign
} from 'lucide-react';

export default function KurulumPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8;

  // STEP 1: Yapı Tipi
  const [buildingType, setBuildingType] = useState<string>('site');

  // STEP 2: Temel Bilgiler
  const [name, setName] = useState('Yıldız Konakları Sitesi');
  const [address, setAddress] = useState('Yıldız Mah. Çamlık Cad. No:42');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Beşiktaş');
  const [managerTc, setManagerTc] = useState('12345678901');
  const [managerPhone, setManagerPhone] = useState('+90 532 111 22 33');
  const [taxNo, setTaxNo] = useState('9876543210');

  // STEP 3: Blok & Daire Yapısı
  const [blocks, setBlocks] = useState<{ id: string; name: string; floors: number; unitsPerFloor: number }[]>([
    { id: '1', name: 'A Blok', floors: 5, unitsPerFloor: 2 },
    { id: '2', name: 'B Blok', floors: 5, unitsPerFloor: 2 },
  ]);
  const [newBlockName, setNewBlockName] = useState('');

  // STEP 4: Arsa & Hisse Payları
  const [defaultArea, setDefaultArea] = useState<number>(120);
  const [defaultShare, setDefaultShare] = useState<number>(5);

  // STEP 5: Sakin Davetleri
  const [residents, setResidents] = useState<{ name: string; email: string; unit: string; role: string }[]>([
    { name: 'Ahmet Yılmaz', email: 'ahmet@yildiz.com', unit: 'A-101', role: 'owner' },
    { name: 'Fatma Kaya', email: 'fatma@yildiz.com', unit: 'A-102', role: 'tenant' },
  ]);
  const [newResName, setNewResName] = useState('');
  const [newResEmail, setNewResEmail] = useState('');
  const [newResUnit, setNewResUnit] = useState('A-101');
  const [newResRole, setNewResRole] = useState('tenant');

  // STEP 6: Aidat Yapısı
  const [duePeriod, setDuePeriod] = useState<string>('monthly');
  const [dueCalculation, setDueCalculation] = useState<string>('equal'); // equal, share, size, manual
  const [dueAmount, setDueAmount] = useState<number>(1500);
  const [lateFee, setLateFee] = useState<number>(5); // %5

  // STEP 7: Ödeme Yöntemi
  const [bankIban, setBankIban] = useState('TR99 0006 2000 0001 2345 6789 01');
  const [bankName, setBankName] = useState('Akbank A.Ş.');
  const [iyzicoActive, setIyzicoActive] = useState(false);

  const addBlock = () => {
    if (!newBlockName.trim()) return;
    setBlocks([
      ...blocks,
      { id: Date.now().toString(), name: newBlockName, floors: 5, unitsPerFloor: 2 }
    ]);
    setNewBlockName('');
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const addResident = () => {
    if (!newResName.trim() || !newResEmail.trim()) return;
    setResidents([
      ...residents,
      { name: newResName, email: newResEmail, unit: newResUnit, role: newResRole }
    ]);
    setNewResName('');
    setNewResEmail('');
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = (loadDemoData: boolean) => {
    alert(loadDemoData ? 'Sistem demo verilerle kuruldu!' : 'Kurulum başarıyla tamamlandı!');
    router.push('/yonetici/dashboard');
  };

  const stepIcons = [
    Building,
    MapPin,
    Layers,
    PieChart,
    Users,
    DollarSign,
    CreditCard,
    CheckCircle
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Hızlı Kurulum Sihirbazı
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Sitenizin dijital yönetim altyapısını 8 kolay adımda tamamlayın.
          </p>
        </div>

        {/* Horizontal Step Indicator */}
        <div className="glass border border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
          {stepIcons.map((Icon, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            return (
              <React.Fragment key={stepNum}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all ${
                      isActive 
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/10'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] mt-2 font-bold ${isActive ? 'text-primary-600' : 'text-[var(--text-tertiary)]'}`}>
                    Adım {stepNum}
                  </span>
                </div>
                {stepNum < totalSteps && (
                  <div className={`flex-1 h-0.5 min-w-[30px] rounded-full ${currentStep > stepNum ? 'bg-emerald-400' : 'bg-[var(--border-color)]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Wizard Step Body */}
        <div className="glass border border-[var(--border-color)] rounded-3xl p-8 shadow-md min-h-[420px] flex flex-col justify-between animate-fade-in">
          
          {/* STEP 1: Yapı Tipi */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Adım 1 — Yapı Tipi Seçimi</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Yöneteceğiniz bağımsız bölüm veya karma yapının tipini belirtin.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {[
                  { id: 'apartment', label: 'Apartman (Tek Blok)', desc: 'Tek girişli bağımsız konut yapısı.' },
                  { id: 'site', label: 'Site (Çok Bloklu)', desc: 'Geniş ortak alanları olan çoklu blok yapıları.' },
                  { id: 'residence', label: 'Rezidans / Kule', desc: 'Resepsiyon ve özel hizmetli modern yapılar.' },
                  { id: 'mall', label: 'AVM / İş Merkezi', desc: 'Ticari dükkanlar ve ofis alanları.' },
                  { id: 'mixed', label: 'Karma Kullanım', desc: 'Konut ve ticari birimlerin ortak yapısı.' },
                  { id: 'villa', label: 'Villa Sitesi', desc: 'Müstakil veya ikiz lüks ev yerleşkeleri.' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setBuildingType(type.id)}
                    className={`text-left p-4 rounded-2xl border transition-all hover:border-primary-500/40 flex flex-col justify-between h-32 ${
                      buildingType === type.id 
                        ? 'border-primary-600 bg-primary-500/5 text-primary-600 dark:border-primary-500/50' 
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/20'
                    }`}
                  >
                    <Building className="h-6 w-6 text-primary-500" />
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{type.label}</h4>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Temel Bilgiler */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Adım 2 — Temel Bilgiler</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Sitenin resmi adı, konumu ve idari vergi dairesi bilgileri.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Site veya Yapı Adı</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Adres</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Şehir</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">İlçe</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Yönetici T.C. Kimlik No (Yetkili)</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={managerTc}
                    onChange={(e) => setManagerTc(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Yönetici Telefon Numarası</label>
                  <input
                    type="tel"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Blok & Daire Yapısı */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Adım 3 — Blok & Daire Yapısı</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Sitedeki aktif blokları ekleyin veya otomatik daire numaralandırmalarını yönetin.</p>
              </div>

              {/* Add block form row */}
              <div className="flex gap-3 items-end">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Yeni Blok Adı</label>
                  <input
                    type="text"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="örn: C Blok veya Kuzey Blok"
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addBlock}
                  className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm flex items-center h-10 shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ekle
                </button>
              </div>

              {/* Blocks list */}
              <div className="grid gap-4 sm:grid-cols-2">
                {blocks.map((block) => (
                  <div key={block.id} className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-tertiary)]/20 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{block.name}</span>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {block.floors} Kat / Kat Başına {block.unitsPerFloor} Daire ({block.floors * block.unitsPerFloor} Daire)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="text-[var(--text-tertiary)] hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Arsa & Hisse Payları */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Adım 4 — Arsa & Hisse Payları</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Aidatların hisse payına göre dağıtılacağı senaryolar için varsayılan birim değerlerini tanımlayın.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Varsayılan Daire Büyüklüğü (m²)</label>
                  <input
                    type="number"
                    value={defaultArea}
                    onChange={(e) => setDefaultArea(Number(e.target.value))}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                  <span className="block text-[10px] text-[var(--text-tertiary)]">Yeni eklenen daireler için varsayılan yüzölçümü.</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Varsayılan Arsa Payı Oranı (%)</label>
                  <input
                    type="number"
                    value={defaultShare}
                    onChange={(e) => setDefaultShare(Number(e.target.value))}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                  <span className="block text-[10px] text-[var(--text-tertiary)]">Kat malikleri kanununa göre aidat paylaştırma oranı.</span>
                </div>
              </div>

              <div className="rounded-xl bg-primary-500/5 border border-primary-500/10 p-4 flex items-start space-x-2.5">
                <Info className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Arsa ve hisse payları, kat malikleri genel kurul kararlarına göre aidat dağılımını belirlemek için kullanılır. İlerleyen aşamalarda daire bazlı olarak düzenlenebilir.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: Sakinleri Davet Et */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Adım 5 — Sakinleri Davet Et</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Sakinlerin e-posta adreslerini daireleriyle eşleştirin. Davet mektubu otomatik gönderilecektir.</p>
              </div>

              {/* Add resident Form */}
              <div className="grid gap-3 sm:grid-cols-4 items-end">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Ad Soyad</label>
                  <input
                    type="text"
                    value={newResName}
                    onChange={(e) => setNewResName(e.target.value)}
                    placeholder="Adı ve soyadı..."
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">E-posta</label>
                  <input
                    type="email"
                    value={newResEmail}
                    onChange={(e) => setNewResEmail(e.target.value)}
                    placeholder="mail@sakin.com"
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addResident}
                  className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm flex items-center h-10 justify-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Davet Ekle
                </button>
              </div>

              {/* Residents Table preview */}
              <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-tertiary)]/30 text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                      <th className="p-3">Sakin</th>
                      <th className="p-3">E-posta</th>
                      <th className="p-3">Daire</th>
                      <th className="p-3">Tip</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-[var(--border-color)]">
                    {residents.map((r, idx) => (
                      <tr key={idx} className="text-[var(--text-primary)]">
                        <td className="p-3 font-semibold">{r.name}</td>
                        <td className="p-3">{r.email}</td>
                        <td className="p-3 font-mono">{r.unit}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${r.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {r.role === 'owner' ? 'Ev Sahibi' : 'Kiracı'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 6: Aidat Yapısı Kur */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Adım 6 — Aidat Yapısı Kur</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Aidat ödeme periyotlarını ve paylaşım hesaplama formülünü belirleyin.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Aidat Periyodu</label>
                  <select
                    value={duePeriod}
                    onChange={(e) => setDuePeriod(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">3 Aylık</option>
                    <option value="annually">Yıllık</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Hesaplama / Paylaştırma Tipi</label>
                  <select
                    value={dueCalculation}
                    onChange={(e) => setDueCalculation(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="equal">Eşit Bölüştürme (Sabit Tutar)</option>
                    <option value="share">Arsa Payına Göre Oranlı</option>
                    <option value="size">Daire m² Büyüklüğüne Göre</option>
                    <option value="manual">Manuel Tanımlı</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Aidat Tutarı (Aylık - ₺)</label>
                  <input
                    type="number"
                    value={dueAmount}
                    onChange={(e) => setDueAmount(Number(e.target.value))}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Gecikme Faizi Oranı (Aylık - %)</label>
                  <input
                    type="number"
                    value={lateFee}
                    onChange={(e) => setLateFee(Number(e.target.value))}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Ödeme Yöntemi */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Adım 7 — Ödeme Yöntemleri</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Sakinlerin ödemelerini yapacağı banka hesap bilgilerini girin.</p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Banka Adı</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Alıcı Hesap IBAN</label>
                    <input
                      type="text"
                      value={bankIban}
                      onChange={(e) => setBankIban(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-color)] p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">İyzico Sanal POS Entegrasyonu</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      Sakinlerin kredi kartı ve taksit seçenekleriyle panel üzerinden online aidat ödemesini aktif edin.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={iyzicoActive}
                      onChange={(e) => setIyzicoActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Tamamlandı */}
          {currentStep === 8 && (
            <div className="space-y-6 text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle className="h-10 w-10 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Kurulum Hazır!</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Apartman/Site yapılandırmanız başarıyla tamamlandı. Artık kontrol paneliniz üzerinden sakinlerinizi yönetebilirsiniz.
                </p>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  Demo Verilerle Doldur ve Başla
                </button>
                
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  className="rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-primary-700 hover:to-indigo-800"
                >
                  Boş Panel ile Başla
                </button>
              </div>
            </div>
          )}

          {/* Wizard Footer Navigation Controls */}
          {currentStep < 8 && (
            <div className="flex items-center justify-between border-t border-[var(--border-color)]/50 pt-6 mt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Geri
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm"
              >
                İleri
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
