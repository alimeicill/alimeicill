-- Kat Mülkiyeti Kanunu ve Akıllı Banka Entegrasyonu Tablo Şemaları
-- iTextSharp makbuz logları, banka MT940 mutabakat logları ve icra takipleri için uygundur.

-- 1. Makbuzlar Tablosu
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Receipts' and xtype='U')
BEGIN
    CREATE TABLE [Receipts] (
        [Id] VARCHAR(191) NOT NULL,
        [InvoiceId] VARCHAR(191) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [ReceiptDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [PdfUrl] VARCHAR(2048) NULL,                      -- Üretilen makbuz PDF adresi
        
        CONSTRAINT [PK_Receipts] PRIMARY KEY ([Id])
    );
END;

-- 2. Banka Eşleştirme ve Mutabakat Tablosu (MT940/API Uyumlu)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BankSyncLogs' and xtype='U')
BEGIN
    CREATE TABLE [BankSyncLogs] (
        [Id] VARCHAR(191) NOT NULL,
        [TransactionRef] VARCHAR(191) NOT NULL UNIQUE,     -- Bankanın gönderdiği benzersiz dekont no
        [TransactionDate] DATETIME NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [SenderName] NVARCHAR(250) NOT NULL,              -- Gönderen hesap adı (Adı Soyadı veya Unvanı)
        [Description] NVARCHAR(500) NOT NULL,             -- Banka açıklama metni
        [Status] VARCHAR(50) NOT NULL,                    -- 'Eslesti', 'Beklemede', 'Manuel_Incelemede'
        [MatchedResidentId] VARCHAR(191) NULL,            -- Otomatik eşleşen sakin ID'si
        [MatchCriteria] VARCHAR(100) NULL,                -- 'TCNo', 'Telefon', 'Isim_Eslesmesi', 'DaireKodu'
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [PK_BankSyncLogs] PRIMARY KEY ([Id])
    );
    
    CREATE INDEX [IX_BankSyncLogs_Status] ON [BankSyncLogs] ([Status]);
END;

-- 3. Hukuki ve İcra Takip Dosyaları Tablosu
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EnforcementCases' and xtype='U')
BEGIN
    CREATE TABLE [EnforcementCases] (
        [Id] VARCHAR(191) NOT NULL,
        [InvoiceId] VARCHAR(191) NOT NULL,
        [Status] VARCHAR(50) NOT NULL,                    -- 'Baslatildi', 'Devam_Ediyor', 'Sonuclandi'
        [CaseNumber] NVARCHAR(100) NULL,                  -- İcra Dairesi ve Dosya Numarası
        [Notes] NVARCHAR(MAX) NULL,                       -- Dava notları
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [PK_EnforcementCases] PRIMARY KEY ([Id])
    );
END;
GO
