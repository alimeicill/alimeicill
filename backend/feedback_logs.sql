-- GeriBildirimler Tablosu için DDL Şeması
-- C# Entity Framework Core veya ADO.NET ile kullanıma uygundur.

-- SQL Server için Tablo Oluşturma
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GeriBildirimler' and xtype='U')
BEGIN
    CREATE TABLE [GeriBildirimler] (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [Konu] VARCHAR(100) NOT NULL,                    -- 'Hata Bildirimi', 'Gelistirme Onerisi', 'Diger'
        [Mesaj] NVARCHAR(MAX) NOT NULL,                  -- Detaylı geri bildirim metni
        [Rol] VARCHAR(50) NOT NULL,                      -- 'Site Yoneticisi', 'Daire Sakini', 'Teknik Personel' vb.
        [AdSoyad] NVARCHAR(150) NOT NULL,                -- Geri bildirimde bulunan kullanıcı adı
        [Url] VARCHAR(2048) NOT NULL,                    -- Hatanın oluştuğu/bildirildiği sayfa URL'si
        [Tarih] DATETIME NOT NULL DEFAULT GETDATE(),     -- Bildirim tarihi
        [Durum] VARCHAR(50) NOT NULL DEFAULT 'Yeni',     -- 'Yeni', 'Inceleniyor', 'Tamamlandi'
        
        CONSTRAINT [PK_GeriBildirimler] PRIMARY KEY ([Id])
    );
    
    CREATE INDEX [IX_GeriBildirimler_Tarih] ON [GeriBildirimler] ([Tarih] DESC);
    CREATE INDEX [IX_GeriBildirimler_Durum] ON [GeriBildirimler] ([Durum]);
END;
GO

/*
-- PostgreSQL için ALTERNATİF Tablo Oluşturma
CREATE TABLE IF NOT EXISTS "GeriBildirimler" (
    "Id" SERIAL NOT NULL,
    "Konu" VARCHAR(100) NOT NULL,
    "Mesaj" TEXT NOT NULL,
    "Rol" VARCHAR(50) NOT NULL,
    "AdSoyad" VARCHAR(150) NOT NULL,
    "Url" VARCHAR(2048) NOT NULL,
    "Tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Durum" VARCHAR(50) NOT NULL DEFAULT 'Yeni',
    
    CONSTRAINT "PK_GeriBildirimler" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_GeriBildirimler_Tarih" ON "GeriBildirimler" ("Tarih" DESC);
CREATE INDEX IF NOT EXISTS "IX_GeriBildirimler_Durum" ON "GeriBildirimler" ("Durum");
*/
