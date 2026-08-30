using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    // Record Weekly Thrift Deposit
    public class RecordSavingsDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int UnitId { get; set; }

        [Required]
        [Range(1, 100000, ErrorMessage = "Amount must be greater than 0.")]
        public decimal Amount { get; set; }

        [Required]
        public int RecordedBy { get; set; }
    }


}