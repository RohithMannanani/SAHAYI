using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class UnitBankAccount
    {
        [Key]
        public int BankAccountId { get; set; }

        [Required]
        public int UnitId { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string AccountNumber { get; set; } = string.Empty;

        [Column(TypeName = "nvarchar(100)")]
        public string BankName { get; set; } = string.Empty;

        [Column(TypeName = "varchar(20)")]
        public string IFSCCode { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 0.00m;

        [Required]
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Navigation Property
        [ForeignKey("UnitId")]
        public virtual AyalkoottamUnit? AyalkoottamUnit { get; set; }
    }
}
