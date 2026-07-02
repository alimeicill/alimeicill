-- SmsLoglari Tablosu için DDL Şeması
-- C# Entity Framework Core veya ADO.NET ile kullanıma uygundur.

-- SQL Server için Tablo Oluşturma
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SmsLoglari' and xtype='U')
BEGIN
    CREATE TABLE [SmsLoglari] (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [KisiId] VARCHAR(191) NULL,                      -- Sakin / Kullanıcı ID
        [SmsTipi] VARCHAR(50) NOT NULL,                 -- 'Duyuru' veya 'Borc'
        [TelefonNo] VARCHAR(50) NOT NULL,
        [MesajMetni] NVARCHAR(MAX) NOT NULL,
        [GonderimTarihi] DATETIME NOT NULL DEFAULT GETDATE(),
        [Durum] VARCHAR(50) NOT NULL,                    -- 'Basarili' veya 'Basarisiz'
        
        CONSTRAINT [PK_SmsLoglari] PRIMARY KEY ([Id])
    );
    
    CREATE INDEX [IX_SmsLoglari_GonderimTarihi] ON [SmsLoglari] ([GonderimTarihi] DESC);
    CREATE INDEX [IX_SmsLoglari_SmsTipi] ON [SmsLoglari] ([SmsTipi]);
END;
GO

/*
-- PostgreSQL için ALTERNATİF Tablo Oluşturma
CREATE TABLE IF NOT EXISTS "SmsLoglari" (
    "Id" SERIAL NOT NULL,
    "KisiId" VARCHAR(191) NULL,
    "SmsTipi" VARCHAR(50) NOT NULL CHECK ("SmsTipi" IN ('Duyuru', 'Borc')),
    "TelefonNo" VARCHAR(50) NOT NULL,
    "MesajMetni" TEXT NOT NULL,
    "GonderimTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Durum" VARCHAR(50) NOT NULL CHECK ("Durum" IN ('Basarili', 'Basarisiz')),
    
    CONSTRAINT "PK_SmsLoglari" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_SmsLoglari_GonderimTarihi" ON "SmsLoglari" ("GonderimTarihi" DESC);
CREATE INDEX IF NOT EXISTS "IX_SmsLoglari_SmsTipi" ON "SmsLoglari" ("SmsTipi");
*/
