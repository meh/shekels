module Component

class PaymentList < Lissio::Component
	attr_accessor :payments

	def initialize(parent, payments = [])
		super(parent)

		@payments = payments
	end

	def remove(payment, target)
		payment.destroy

		parent = target.parent
		succ   = parent.next_element
		prev   = parent.previous_element
		list   = parent.parent

		if prev.class_name == 'week' && (!succ || succ.class_name == 'week')
			prev.remove
			succ.remove if succ
		end

		parent.remove

		if list.children.length == 0
			Shekels.refresh
		end
	end

	tag name: :div, class: 'payment-list'

	html do |_|
		previous = nil

		@payments.sort_by(&:at).reverse.each do |payment|
			if previous
				previous = previous.at - ((previous.at.wday - 1) * 24 * 60 * 60)
				current  = payment.at  - ((payment.at.wday - 1) * 24 * 60 * 60)

				if previous.strftime('%F') != current.strftime('%F')
					first = current
					last  = first + (6 * 24 * 60 * 60)

					_.div.week do
						_.span.start first.strftime('%F')
						_.span.separator '..'
						_.span.end last.strftime('%F')
					end
				end
			else
				first = payment.at - ((payment.at.wday - 1) * 24 * 60 * 60)
				last  = first + (6 * 24 * 60 * 60)

				_.div.week do
					_.span.start first.strftime('%F')
					_.span.separator '..'
					_.span.end last.strftime('%F')
				end
			end

			previous = payment

			_.div do
				if payment.recipient
					if payment.sign == :-
						_.span "You owe"

						_.span.remover.text(" ₪ ").on :click do |e|
							remove(payment, e.target)
						end

						_.span.negative payment.amount.to_s
						_.span " to "
						_.a.href("/person/#{payment.recipient.name}").text(payment.recipient.name).
							on :click do |e|
								e.stop!; Shekels.navigate(e.target[:href])
							end

						if payment.for
							_.span " for "
							_.span payment.for
						end

						_.span " on "
						_.span payment.at.strftime('%A')
					else
						_.a.href("/person/#{payment.recipient.name}").text(payment.recipient.name).
							on :click do |e|
								e.stop!; Shekels.navigate(e.target[:href])
							end
						_.span " owes you"

						_.span.remover.text(" ₪ ").on :click do |e|
							remove(payment, e.target)
						end

						_.span.positive payment.amount.to_s

						if payment.for
							_.span " for "
							_.span payment.for
						end

						_.span " on "
						_.span payment.at.strftime('%A')
					end
				else
					_.span "You spent"

					_.span.remover.text(" ₪ ").on :click do |e|
						remove(payment, e.target)
					end

					_.span.negative payment.amount.to_s

					if payment.for
						_.span " for "
						_.span payment.for
					end

					_.span " on "
					_.span payment.at.strftime('%A')
				end
			end
		end
	end

	css do
		rule '.payment-list' do
			width 100.%

			rule 'div' do
				line height: 1.5.em

				rule '&.week' do
					border bottom: [1.px, :solid, '#555']
					font weight: :bold
					width 18.ch
					margin 10.px, :auto

					rule '.separator' do
						font weight: :normal
						padding left:  10.px,
						        right: 10.px
					end
				end

				rule '.remover' do
					cursor :crosshair
				end
			end
		end
	end
end

end
