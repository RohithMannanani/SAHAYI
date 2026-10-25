using System;
using System.Linq;
using Sahayi.Api.Entities;

namespace Sahayi.Api.Helpers
{
    public static class LoanFineCalculator
    {
        public const decimal FinePerMissedMonth = 50.00m;

        /// <summary>
        /// Calculates total accumulated fine for missed 1-month repayment intervals.
        /// If in any completed 1-month interval since disbursement, the member did not pay
        /// any interest or principal amount (AmountPaid > 0), a ₹50 fine is added.
        /// </summary>
        public static decimal CalculateFine(LoanApplication loan, DateTime? checkDate = null)
        {
            if (loan == null || !loan.DisbursedDate.HasValue)
                return 0m;

            if (loan.Status != "Disbursed" && loan.Status != "Closed")
                return 0m;

            DateTime startDate = loan.DisbursedDate.Value;
            DateTime maxRepaymentDate = (loan.LoanRepayments != null && loan.LoanRepayments.Any())
                ? loan.LoanRepayments.Max(r => r.RepaymentDate)
                : DateTime.MinValue;

            DateTime now = checkDate ?? (maxRepaymentDate > DateTime.UtcNow ? maxRepaymentDate : DateTime.UtcNow);
            decimal totalFine = 0m;

            int monthIndex = 1;
            while (true)
            {
                DateTime intervalEnd = startDate.AddMonths(monthIndex);

                // Only evaluate 1-month intervals that have completed
                if (intervalEnd > now)
                    break;

                // Check if at least monthIndex repayments with AmountPaid > 0 occurred on or before intervalEnd
                int repaymentCount = loan.LoanRepayments != null
                    ? loan.LoanRepayments.Count(r => r.RepaymentDate <= intervalEnd && r.AmountPaid > 0)
                    : 0;

                if (repaymentCount < monthIndex)
                {
                    totalFine += FinePerMissedMonth;
                }

                monthIndex++;
            }

            return totalFine;
        }

        public static decimal GetTotalLoanAmount(LoanApplication loan, DateTime? checkDate = null)
        {
            if (loan == null) return 0m;
            decimal fine = CalculateFine(loan, checkDate);
            return loan.AmountRequested + fine;
        }

        public static decimal GetOutstandingBalance(LoanApplication loan, DateTime? checkDate = null)
        {
            if (loan == null) return 0m;
            decimal totalLoan = GetTotalLoanAmount(loan, checkDate);
            decimal totalPrincipalPaid = loan.LoanRepayments?.Sum(r => r.PrincipalComponent) ?? 0m;
            return Math.Max(0m, totalLoan - totalPrincipalPaid);
        }
    }
}
