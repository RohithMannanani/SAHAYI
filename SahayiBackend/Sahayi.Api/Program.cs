using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sahayi.Api.Data;
using Sahayi.Api.Services; // 👈 Import your Services namespace

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context Configuration
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(60);
        }));

// 2. Register Custom Services for Dependency Injection
builder.Services.AddHttpClient(); // 👈 Added for SMS Gateway HTTP calls
builder.Services.AddScoped<ITokenService, TokenService>(); // 👈 Added TokenService registration
builder.Services.AddScoped<ISmsService, SmsService>();     // 👈 Added SmsService registration for OTP
builder.Services.AddScoped<Sahayi.Api.Services.Interfaces.IChatService, Sahayi.Api.Services.Implementations.ChatService>(); // 👈 ChatService

// Add SignalR
builder.Services.AddSignalR();

// 3. Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "4hW5PbvO3ONDf2MWStoY/zUqUkIV060l1fhe37e3Lvc=";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Sahayi.Api",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "Sahayi.Client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        
        // Support SignalR authentication via query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// 4. Configure CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 5. Add API Controllers & Swagger Documentation
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ensure DB Schema is up to date for LoanRepayments.PaymentMode
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        dbContext.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (
                SELECT 1 FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') 
                AND name = 'PaymentMode'
            )
            BEGIN
                ALTER TABLE [dbo].[LoanRepayments] ADD [PaymentMode] varchar(50) NOT NULL DEFAULT 'Cash (Bank Deposited)';
            END

            IF NOT EXISTS (
                SELECT 1 FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[LoanApplications]') 
                AND name = 'RejectionReason'
            )
            BEGIN
                ALTER TABLE [dbo].[LoanApplications] ADD [RejectionReason] varchar(500) NULL;
            END
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Schema ensure notice: {ex.Message}");
    }
}

// 6. HTTP Request Pipeline Configuration
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Middleware order matters: Authentication MUST come before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<Sahayi.Api.Hubs.ChatHub>("/chathub");

app.Run();