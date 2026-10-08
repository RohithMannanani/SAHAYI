using System.Threading.Tasks;

namespace Sahayi.Api.Services
{
    public interface ISmsService
    {
        Task<bool> SendOtpAsync(string phoneNumber, string FullName,string otpCode);
        Task<bool> SendLoanRejectionAsync(string phoneNumber, string fullName, decimal amount, string reason);
    }
}
