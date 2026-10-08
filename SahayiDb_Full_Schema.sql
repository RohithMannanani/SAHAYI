IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [PanchayathWards] (
        [WardId] int NOT NULL IDENTITY,
        [WardNumber] int NOT NULL,
        [WardName] varchar(100) NOT NULL,
        CONSTRAINT [PK_PanchayathWards] PRIMARY KEY ([WardId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [PasswordResetOtps] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(20) NOT NULL,
        [OtpCode] nvarchar(10) NOT NULL,
        [ResetToken] nvarchar(100) NULL,
        [ExpiryTime] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_PasswordResetOtps] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [UserRoles] (
        [RoleId] int NOT NULL IDENTITY,
        [RoleName] varchar(50) NOT NULL,
        [Description] varchar(255) NULL,
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([RoleId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [AyalkoottamUnits] (
        [UnitId] int NOT NULL IDENTITY,
        [UnitName] varchar(150) NOT NULL,
        [PrimaryContactPhone] varchar(15) NOT NULL,
        [WardId] int NOT NULL,
        [AccountNumber] varchar(50) NOT NULL,
        [BankName] varchar(100) NOT NULL,
        [IFSCCode] varchar(20) NOT NULL,
        [AccountBalance] decimal(18,2) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_AyalkoottamUnits] PRIMARY KEY ([UnitId]),
        CONSTRAINT [FK_AyalkoottamUnits_PanchayathWards_WardId] FOREIGN KEY ([WardId]) REFERENCES [PanchayathWards] ([WardId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [ApplicationUsers] (
        [UserId] int NOT NULL IDENTITY,
        [Username] varchar(50) NOT NULL,
        [FullName] varchar(150) NOT NULL,
        [PhoneNumber] varchar(15) NOT NULL,
        [HouseName] varchar(150) NOT NULL,
        [PasswordHash] varchar(max) NOT NULL,
        [IsPasswordChanged] bit NOT NULL,
        [RoleId] int NOT NULL,
        [UnitId] int NULL,
        [JoinedDate] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_ApplicationUsers] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_ApplicationUsers_AyalkoottamUnits_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [AyalkoottamUnits] ([UnitId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ApplicationUsers_UserRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [UserRoles] ([RoleId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [ChatGroups] (
        [GroupId] int NOT NULL IDENTITY,
        [UnitId] int NOT NULL,
        [GroupName] varchar(100) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        CONSTRAINT [PK_ChatGroups] PRIMARY KEY ([GroupId]),
        CONSTRAINT [FK_ChatGroups_AyalkoottamUnits_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [AyalkoottamUnits] ([UnitId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [DirectMessages] (
        [DirectMessageId] bigint NOT NULL IDENTITY,
        [SenderId] int NOT NULL,
        [ReceiverId] int NOT NULL,
        [MessageText] varchar(max) NOT NULL,
        [SentAt] datetime2 NOT NULL,
        [IsRead] bit NOT NULL,
        CONSTRAINT [PK_DirectMessages] PRIMARY KEY ([DirectMessageId]),
        CONSTRAINT [FK_DirectMessages_ApplicationUsers_ReceiverId] FOREIGN KEY ([ReceiverId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_DirectMessages_ApplicationUsers_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [LoanApplications] (
        [LoanId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [UnitId] int NOT NULL,
        [AmountRequested] decimal(18,2) NOT NULL,
        [Purpose] varchar(500) NOT NULL,
        [TenureMonths] int NOT NULL,
        [InterestRate] decimal(5,2) NOT NULL,
        [Status] varchar(20) NOT NULL,
        [AppliedDate] datetime2 NOT NULL,
        [ApprovedBy] int NULL,
        [DisbursedDate] datetime2 NULL,
        CONSTRAINT [PK_LoanApplications] PRIMARY KEY ([LoanId]),
        CONSTRAINT [FK_LoanApplications_ApplicationUsers_ApprovedBy] FOREIGN KEY ([ApprovedBy]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_LoanApplications_ApplicationUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_LoanApplications_AyalkoottamUnits_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [AyalkoottamUnits] ([UnitId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [Meetings] (
        [MeetingId] int NOT NULL IDENTITY,
        [UnitId] int NOT NULL,
        [MeetingDate] datetime2 NOT NULL,
        [Venue] varchar(200) NOT NULL,
        [MinutesOfMeeting] varchar(max) NULL,
        [CreatedBy] int NOT NULL,
        CONSTRAINT [PK_Meetings] PRIMARY KEY ([MeetingId]),
        CONSTRAINT [FK_Meetings_ApplicationUsers_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Meetings_AyalkoottamUnits_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [AyalkoottamUnits] ([UnitId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [Notifications] (
        [NotificationId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Title] varchar(100) NOT NULL,
        [Message] varchar(500) NOT NULL,
        [IsRead] bit NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([NotificationId]),
        CONSTRAINT [FK_Notifications_ApplicationUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [SavingsTransactions] (
        [TransactionId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [UnitId] int NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [TransactionDate] datetime2 NOT NULL,
        [ReceiptNumber] varchar(50) NOT NULL,
        [RecordedBy] int NOT NULL,
        CONSTRAINT [PK_SavingsTransactions] PRIMARY KEY ([TransactionId]),
        CONSTRAINT [FK_SavingsTransactions_ApplicationUsers_RecordedBy] FOREIGN KEY ([RecordedBy]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SavingsTransactions_ApplicationUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SavingsTransactions_AyalkoottamUnits_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [AyalkoottamUnits] ([UnitId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [UserCredentials] (
        [LoginId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [UserName] varchar(50) NOT NULL,
        [PasswordHash] varchar(max) NOT NULL,
        [IsPasswordChanged] bit NOT NULL,
        [LastLoginAt] datetime2 NULL,
        [IsLocked] bit NOT NULL,
        CONSTRAINT [PK_UserCredentials] PRIMARY KEY ([LoginId]),
        CONSTRAINT [FK_UserCredentials_ApplicationUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [GroupMessages] (
        [GroupMessageId] bigint NOT NULL IDENTITY,
        [GroupId] int NOT NULL,
        [SenderId] int NOT NULL,
        [MessageText] varchar(max) NOT NULL,
        [SentAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_GroupMessages] PRIMARY KEY ([GroupMessageId]),
        CONSTRAINT [FK_GroupMessages_ApplicationUsers_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_GroupMessages_ChatGroups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [ChatGroups] ([GroupId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [LoanRepayments] (
        [RepaymentId] int NOT NULL IDENTITY,
        [LoanId] int NOT NULL,
        [AmountPaid] decimal(18,2) NOT NULL,
        [PrincipalComponent] decimal(18,2) NOT NULL,
        [InterestComponent] decimal(18,2) NOT NULL,
        [RepaymentDate] datetime2 NOT NULL,
        [ReceiptNumber] varchar(50) NOT NULL,
        [RecordedBy] int NOT NULL,
        CONSTRAINT [PK_LoanRepayments] PRIMARY KEY ([RepaymentId]),
        CONSTRAINT [FK_LoanRepayments_ApplicationUsers_RecordedBy] FOREIGN KEY ([RecordedBy]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_LoanRepayments_LoanApplications_LoanId] FOREIGN KEY ([LoanId]) REFERENCES [LoanApplications] ([LoanId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE TABLE [Attendances] (
        [AttendanceId] int NOT NULL IDENTITY,
        [MeetingId] int NOT NULL,
        [UserId] int NOT NULL,
        [IsPresent] bit NOT NULL,
        [MarkedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Attendances] PRIMARY KEY ([AttendanceId]),
        CONSTRAINT [FK_Attendances_ApplicationUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [ApplicationUsers] ([UserId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Attendances_Meetings_MeetingId] FOREIGN KEY ([MeetingId]) REFERENCES [Meetings] ([MeetingId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'RoleId', N'Description', N'RoleName') AND [object_id] = OBJECT_ID(N'[UserRoles]'))
        SET IDENTITY_INSERT [UserRoles] ON;
    EXEC(N'INSERT INTO [UserRoles] ([RoleId], [Description], [RoleName])
    VALUES (1, ''CDS Level System Administrator'', ''CDS_Admin''),
    (2, ''Ayalkoottam President (Supervisory & Auditing)'', ''President''),
    (3, ''Ayalkoottam Secretary (Operations & Management)'', ''Secretary''),
    (4, ''Ayalkoottam Treasurer (Finance & Ledgers)'', ''Treasurer''),
    (5, ''Ayalkoottam General Member'', ''Member'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'RoleId', N'Description', N'RoleName') AND [object_id] = OBJECT_ID(N'[UserRoles]'))
        SET IDENTITY_INSERT [UserRoles] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ApplicationUsers_PhoneNumber] ON [ApplicationUsers] ([PhoneNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ApplicationUsers_RoleId] ON [ApplicationUsers] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ApplicationUsers_UnitId] ON [ApplicationUsers] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ApplicationUsers_Username] ON [ApplicationUsers] ([Username]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Attendances_MeetingId] ON [Attendances] ([MeetingId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Attendances_UserId] ON [Attendances] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AyalkoottamUnits_WardId] ON [AyalkoottamUnits] ([WardId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ChatGroups_UnitId] ON [ChatGroups] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DirectMessages_ReceiverId] ON [DirectMessages] ([ReceiverId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DirectMessages_SenderId] ON [DirectMessages] ([SenderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_GroupMessages_GroupId] ON [GroupMessages] ([GroupId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_GroupMessages_SenderId] ON [GroupMessages] ([SenderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_LoanApplications_ApprovedBy] ON [LoanApplications] ([ApprovedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_LoanApplications_UnitId] ON [LoanApplications] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_LoanApplications_UserId] ON [LoanApplications] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_LoanRepayments_LoanId] ON [LoanRepayments] ([LoanId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_LoanRepayments_ReceiptNumber] ON [LoanRepayments] ([ReceiptNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_LoanRepayments_RecordedBy] ON [LoanRepayments] ([RecordedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Meetings_CreatedBy] ON [Meetings] ([CreatedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Meetings_UnitId] ON [Meetings] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PanchayathWards_WardNumber] ON [PanchayathWards] ([WardNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SavingsTransactions_ReceiptNumber] ON [SavingsTransactions] ([ReceiptNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SavingsTransactions_RecordedBy] ON [SavingsTransactions] ([RecordedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SavingsTransactions_UnitId] ON [SavingsTransactions] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SavingsTransactions_UserId] ON [SavingsTransactions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_UserCredentials_UserId] ON [UserCredentials] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserCredentials_UserName] ON [UserCredentials] ([UserName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserRoles_RoleName] ON [UserRoles] ([RoleName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810041317_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260810041317_InitialCreate', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811174817_AddUnitBankAccountAndPaymentMode'
)
BEGIN
    ALTER TABLE [SavingsTransactions] ADD [PaymentMode] varchar(50) NOT NULL DEFAULT '';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811174817_AddUnitBankAccountAndPaymentMode'
)
BEGIN
    CREATE TABLE [UnitBankAccounts] (
        [BankAccountId] int NOT NULL IDENTITY,
        [UnitId] int NOT NULL,
        [AccountNumber] varchar(50) NOT NULL,
        [BankName] nvarchar(100) NOT NULL,
        [IFSCCode] varchar(20) NOT NULL,
        [Balance] decimal(18,2) NOT NULL,
        [LastUpdated] datetime2 NOT NULL,
        CONSTRAINT [PK_UnitBankAccounts] PRIMARY KEY ([BankAccountId]),
        CONSTRAINT [FK_UnitBankAccounts_AyalkoottamUnits_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [AyalkoottamUnits] ([UnitId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811174817_AddUnitBankAccountAndPaymentMode'
)
BEGIN
    CREATE INDEX [IX_UnitBankAccounts_UnitId] ON [UnitBankAccounts] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811174817_AddUnitBankAccountAndPaymentMode'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811174817_AddUnitBankAccountAndPaymentMode', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814045520_AddMeetingCompletionFields'
)
BEGIN
    ALTER TABLE [Meetings] ADD [CompletedDate] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814045520_AddMeetingCompletionFields'
)
BEGIN
    ALTER TABLE [Meetings] ADD [IsCompleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814045520_AddMeetingCompletionFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260814045520_AddMeetingCompletionFields', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814051011_AddMeetingTimeColumn'
)
BEGIN
    ALTER TABLE [Meetings] ADD [MeetingTime] varchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814051011_AddMeetingTimeColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260814051011_AddMeetingTimeColumn', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817081712_AddSavingsWeekIdColumn'
)
BEGIN
    ALTER TABLE [SavingsTransactions] ADD [SavingsWeekId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817081712_AddSavingsWeekIdColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260817081712_AddSavingsWeekIdColumn', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    DROP INDEX [IX_UnitBankAccounts_UnitId] ON [UnitBankAccounts];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    CREATE TABLE [SavingsWeeks] (
        [Id] int NOT NULL IDENTITY,
        [UnitId] int NOT NULL,
        [WeekNumber] int NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Status] varchar(20) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SavingsWeeks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SavingsWeeks_AyalkoottamUnits_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [AyalkoottamUnits] ([UnitId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UnitBankAccounts_UnitId] ON [UnitBankAccounts] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_SavingsTransactions_SavingsWeekId_UserId] ON [SavingsTransactions] ([SavingsWeekId], [UserId]) WHERE [SavingsWeekId] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SavingsWeeks_UnitId_WeekNumber] ON [SavingsWeeks] ([UnitId], [WeekNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    UPDATE SavingsTransactions SET SavingsWeekId = NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    ALTER TABLE [SavingsTransactions] ADD CONSTRAINT [FK_SavingsTransactions_SavingsWeeks_SavingsWeekId] FOREIGN KEY ([SavingsWeekId]) REFERENCES [SavingsWeeks] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260817161957_AddSavingsWeeksTableAndUniqueConstraint', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923071855_AddAvatarUrl'
)
BEGIN
    ALTER TABLE [ApplicationUsers] ADD [AvatarUrl] varchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923071855_AddAvatarUrl'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260923071855_AddAvatarUrl', N'10.0.10');
END;

COMMIT;
GO

