-- PaymentAccount ve AccountTransaction Tabloları için DDL Şeması
-- C# Entity Framework Core veya ADO.NET ile kullanıma uygundur.

-- SQL Server için Tabloları Oluşturma
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentAccounts' and xtype='U')
BEGIN
    CREATE TABLE [PaymentAccounts] (
        [Id] VARCHAR(191) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,                  -- Hesap Adı (Örn: 'Ana Kasa', 'Vakıfbank Aidat Hesabı')
        [Type] VARCHAR(50) NOT NULL,                    -- 'KASA' veya 'BANKA'
        [BankName] NVARCHAR(150) NULL,                  -- Banka Adı
        [Iban] VARCHAR(50) NULL,                        -- IBAN Numarası
        [Owner] NVARCHAR(150) NULL,                     -- Hesap Sahibi / Yetkilisi
        [Balance] DECIMAL(18,2) NOT NULL DEFAULT 0.0,    -- Hesap Güncel Bakiyesi
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [PK_PaymentAccounts] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AccountTransactions' and xtype='U')
BEGIN
    CREATE TABLE [AccountTransactions] (
        [Id] VARCHAR(191) NOT NULL,
        [AccountId] VARCHAR(191) NOT NULL,
        [Type] VARCHAR(50) NOT NULL,                    -- 'TAHSILAT', 'HARICI_TAHSILAT', 'GIDER_ODEME', 'FIRMA_PERSONEL_ODEME', 'VIRMAN_GIRIS', 'VIRMAN_CIKIS'
        [Amount] DECIMAL(18,2) NOT NULL,
        [Direction] VARCHAR(10) NOT NULL,               -- 'giris' veya 'cikis'
        [RelatedAccountId] VARCHAR(191) NULL,           -- Virman işlemlerinde karşı hesap
        [Description] NVARCHAR(500) NOT NULL,
        [RelatedPersonId] VARCHAR(191) NULL,            -- Sakin, Tedarikçi veya Personel ID'si
        [DocumentUrl] VARCHAR(2048) NULL,               -- Yüklenen dekont/belge linki
        [TransactionDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [CreatedBy] VARCHAR(191) NOT NULL,              -- İşlemi yapan kullanıcı
        
        CONSTRAINT [PK_AccountTransactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AccountTransactions_PaymentAccounts] FOREIGN KEY ([AccountId]) REFERENCES [PaymentAccounts]([Id]) ON DELETE CASCADE
    );
    
    CREATE INDEX [IX_AccountTransactions_AccountId] ON [AccountTransactions] ([AccountId]);
    CREATE INDEX [IX_AccountTransactions_TransactionDate] ON [AccountTransactions] ([TransactionDate] DESC);
END;
GO
