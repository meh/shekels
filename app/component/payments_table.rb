module Component

class PaymentsTable < Lissio::Component
	attr_accessor :payments

	def initialize(parent, payments = [])
		super(parent)

		@payments = payments
	end

	def render
		element.inner_dom do |d|
			@payments.each do |payment|
				d.tr do
					if payment.sign == :-
						d.td.amount.negative payment.amount.to_s
					else
						d.td.amount.positive payment.amount.to_s
					end

					if Person === payment.for
						d.td.recipient do
							d.a.href("/person/#{payment.for.name}").do(payment.for.name).
								on :click do |e|
									e.stop!; Shekels.navigate(e.target[:href])
								end
						end
					else
						d.td.recipient payment.for.name
					end

					d.td.date payment.at.strftime('%F')
				end
			end
		end
	end

	tag name: :table, class: :payments

	css do
		rule 'table.payments' do
			width 100.%

			rule '.negative' do
				background color: '#f2dede'
			end

			rule '.positive' do
				background color: '#dff0d8'
			end

			rule 'tr' do
				rule 'td' do
					border 1.px, :solid, '#555'

					rule '&.amount', '&.date' do
						padding 0, 5.px
					end

					rule '&.recipient' do
						width 100.%
					end
				end
			end
		end
	end
end

end
