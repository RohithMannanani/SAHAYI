using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Entities;

namespace Sahayi.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // ==========================================
        // 1. DB SETS (13 TABLES)
        // ==========================================
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<PanchayathWard> PanchayathWards { get; set; }
        public DbSet<AyalkoottamUnit> AyalkoottamUnits { get; set; }
        public DbSet<ApplicationUser> ApplicationUsers { get; set; }
        public DbSet<Meeting> Meetings { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<SavingsTransaction> SavingsTransactions { get; set; }
        public DbSet<LoanApplication> LoanApplications { get; set; }
        public DbSet<LoanRepayment> LoanRepayments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ChatGroup> ChatGroups { get; set; }
        public DbSet<GroupMessage> GroupMessages { get; set; }
        public DbSet<DirectMessage> DirectMessages { get; set; }

        // ==========================================
        // 2. MODEL CONFIGURATIONS & FLUENT API
        // ==========================================
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ------------------------------------------
            // UNIQUE INDEXES
            // ------------------------------------------
            modelBuilder.Entity<UserRole>()
                .HasIndex(r => r.RoleName)
                .IsUnique();

            modelBuilder.Entity<PanchayathWard>()
                .HasIndex(w => w.WardNumber)
                .IsUnique();

            modelBuilder.Entity<ApplicationUser>()
                .HasIndex(u => u.PhoneNumber)
                .IsUnique();

            modelBuilder.Entity<SavingsTransaction>()
                .HasIndex(st => st.ReceiptNumber)
                .IsUnique();

            modelBuilder.Entity<LoanRepayment>()
                .HasIndex(lr => lr.ReceiptNumber)
                .IsUnique();

            // ------------------------------------------
            // FINANCIAL DECIMAL PRECISION (18, 2)
            // ------------------------------------------
            modelBuilder.Entity<SavingsTransaction>()
                .Property(s => s.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<LoanApplication>()
                .Property(l => l.AmountRequested)
                .HasPrecision(18, 2);

            modelBuilder.Entity<LoanApplication>()
                .Property(l => l.InterestRate)
                .HasPrecision(5, 2);

            modelBuilder.Entity<LoanRepayment>()
                .Property(r => r.AmountPaid)
                .HasPrecision(18, 2);

            modelBuilder.Entity<LoanRepayment>()
                .Property(r => r.PrincipalComponent)
                .HasPrecision(18, 2);

            modelBuilder.Entity<LoanRepayment>()
                .Property(r => r.InterestComponent)
                .HasPrecision(18, 2);

            // ------------------------------------------
            // RELATIONSHIPS & CASCADE DELETE BEHAVIORS
            // ------------------------------------------

            // 1. AyalkoottamUnit -> PanchayathWard
            modelBuilder.Entity<AyalkoottamUnit>()
                .HasOne(u => u.Ward)
                .WithMany(w => w.Units)
                .HasForeignKey(u => u.WardId)
                .OnDelete(DeleteBehavior.Restrict);

            // 2. ApplicationUser -> Role & Unit
            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Role)
                .WithMany()
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Unit)
                .WithMany(unit => unit.Users)
                .HasForeignKey(u => u.UnitId)
                .OnDelete(DeleteBehavior.Restrict);

            // 3. Meeting -> Unit & CreatedBy User
            modelBuilder.Entity<Meeting>()
                .HasOne(m => m.Unit)
                .WithMany(u => u.Meetings)
                .HasForeignKey(m => m.UnitId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Meeting>()
                .HasOne(m => m.Creator)
                .WithMany()
                .HasForeignKey(m => m.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // 4. Attendance -> Meeting & User
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Meeting)
                .WithMany(m => m.Attendances)
                .HasForeignKey(a => a.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // 5. SavingsTransaction -> User, Unit, Recorder
            modelBuilder.Entity<SavingsTransaction>()
                .HasOne(st => st.User)
                .WithMany()
                .HasForeignKey(st => st.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SavingsTransaction>()
                .HasOne(st => st.Unit)
                .WithMany()
                .HasForeignKey(st => st.UnitId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SavingsTransaction>()
                .HasOne(st => st.Recorder)
                .WithMany()
                .HasForeignKey(st => st.RecordedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // 6. LoanApplication -> User, Unit, Approver
            modelBuilder.Entity<LoanApplication>()
                .HasOne(la => la.User)
                .WithMany()
                .HasForeignKey(la => la.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LoanApplication>()
                .HasOne(la => la.Unit)
                .WithMany()
                .HasForeignKey(la => la.UnitId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LoanApplication>()
                .HasOne(la => la.Approver)
                .WithMany()
                .HasForeignKey(la => la.ApprovedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // 7. LoanRepayment -> LoanApplication & Recorder
            modelBuilder.Entity<LoanRepayment>()
                .HasOne(lr => lr.Loan)
                .WithMany(la => la.Repayments)
                .HasForeignKey(lr => lr.LoanId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LoanRepayment>()
                .HasOne(lr => lr.Recorder)
                .WithMany()
                .HasForeignKey(lr => lr.RecordedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // 8. Notifications -> User
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 9. ChatGroup -> Unit
            modelBuilder.Entity<ChatGroup>()
                .HasOne(cg => cg.Unit)
                .WithMany(u => u.ChatGroups)
                .HasForeignKey(cg => cg.UnitId)
                .OnDelete(DeleteBehavior.Cascade);

            // 10. GroupMessage -> ChatGroup & Sender User
            modelBuilder.Entity<GroupMessage>()
                .HasOne(gm => gm.Group)
                .WithMany(g => g.GroupMessages)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GroupMessage>()
                .HasOne(gm => gm.Sender)
                .WithMany()
                .HasForeignKey(gm => gm.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            // 11. DirectMessage -> Sender & Receiver
            modelBuilder.Entity<DirectMessage>()
                .HasOne(dm => dm.Sender)
                .WithMany()
                .HasForeignKey(dm => dm.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DirectMessage>()
                .HasOne(dm => dm.Receiver)
                .WithMany()
                .HasForeignKey(dm => dm.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // ------------------------------------------
            // INITIAL SEED DATA (USER ROLES)
            // ------------------------------------------
            modelBuilder.Entity<UserRole>().HasData(
                new UserRole { RoleId = 1, RoleName = "CDS_Admin", Description = "CDS Level System Administrator" },
                new UserRole { RoleId = 2, RoleName = "President", Description = "Ayalkoottam President (Supervisory & Auditing)" },
                new UserRole { RoleId = 3, RoleName = "Secretary", Description = "Ayalkoottam Secretary (Operations & Management)" },
                new UserRole { RoleId = 4, RoleName = "Treasurer", Description = "Ayalkoottam Treasurer (Finance & Ledgers)" },
                new UserRole { RoleId = 5, RoleName = "Member", Description = "Ayalkoottam General Member" }
            );
        }
    }
}